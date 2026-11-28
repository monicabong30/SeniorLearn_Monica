import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { colors, shadow, space, type } from "../theme/tokens";
import { CountryFlag } from "./CountryFlag";
import { Ionicons } from "@expo/vector-icons";
type Country = { iso: CountryCode; name: string; code: string };
const preferred: CountryCode[] = ["AU", "NZ", "MY", "SG", "GB", "US", "CA"];
// `Intl.DisplayNames` is available in browsers but is not guaranteed in every
// Hermes runtime shipped in a standalone APK. Do not evaluate it at module
// load: this field is rendered by Personal Information and a missing
// constructor otherwise prevents the entire screen from mounting.
const commonNames: Partial<Record<CountryCode, string>> = { AU: "Australia", NZ: "New Zealand", MY: "Malaysia", SG: "Singapore", GB: "United Kingdom", US: "United States", CA: "Canada" };
const displayNames = typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : undefined;
const countryName = (iso: CountryCode) => commonNames[iso] ?? displayNames?.of(iso) ?? iso;
const countries: Country[] = [...getCountries()].sort((a, b) => (preferred.indexOf(a) + 1 || 99) - (preferred.indexOf(b) + 1 || 99) || countryName(a).localeCompare(countryName(b))).map((iso) => ({ iso, name: countryName(iso), code: `+${getCountryCallingCode(iso)}` }));
const byIso = new Map(countries.map((country) => [country.iso, country]));
const fallback = countries.find((item) => item.iso === "AU")!;
const phoneExamples: Partial<Record<CountryCode, string>> = {
  AU: "e.g. 412 345 678", NZ: "e.g. 21 123 4567", MY: "e.g. 12 345 6789",
  SG: "e.g. 8123 4567", GB: "e.g. 7123 456789", US: "e.g. 202 555 0123", CA: "e.g. 416 555 0123",
};
// libphonenumber resolves shared calling codes (for example +1) to the actual
// country when the national number contains enough information.
const fromValue = (value: string) => {
  const country = parsePhoneNumberFromString(value)?.country;
  return (country && byIso.get(country)) || countries.find((item) => value.startsWith(item.code)) || fallback;
};
export function PhoneNumberField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(""), [above, setAbove] = useState(false);
  const selectorRef = useRef<any>(null), [anchor, setAnchor] = useState({ x: 0, y: 0, width: 300, height: 52 });
  const [selectedIso, setSelectedIso] = useState<CountryCode>(() => fromValue(value).iso);
  const country = byIso.get(selectedIso) ?? fallback, parsed = parsePhoneNumberFromString(value), number = parsed?.country === country.iso ? parsed.nationalNumber : value.startsWith(country.code) ? value.slice(country.code.length) : value.replace(/^\+/, "");
  const results = useMemo(() => { const q = query.trim().toLowerCase(); return q ? countries.filter((item) => item.name.toLowerCase().includes(q) || item.code.includes(q) || item.iso.toLowerCase() === q) : countries; }, [query]);
  useEffect(() => { if (!open || Platform.OS !== "web") return; const handler = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [open]);
  const show = () => { selectorRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => { setAnchor({ x, y, width, height }); setAbove(y + height + 320 > Dimensions.get("window").height); }); setQuery(""); setOpen(true); };
  const choose = (next: Country) => { setSelectedIso(next.iso); onChange(`${next.code}${number.replace(/\D/g, "")}`); setOpen(false); };
  return <View style={[s.box, open && s.openBox]}>
    <Text style={s.label}>Phone number</Text><View ref={selectorRef} collapsable={false} style={[s.control, error ? s.invalid : null]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Select country calling code" accessibilityState={{ expanded: open }} onPress={() => open ? setOpen(false) : show()} style={s.codeButton}><CountryFlag iso={country.iso} /><Text style={s.code}>{country.code}</Text><Ionicons name={open?'chevron-up':'chevron-down'} size={20} color={colors.primary}/></Pressable>
      <TextInput accessibilityLabel="Phone number" autoComplete="tel" keyboardType="phone-pad" placeholder={phoneExamples[country.iso] ?? "e.g. 412 345 678"} placeholderTextColor={colors.textSecondary} value={number} onFocus={() => setOpen(false)} onChangeText={(next) => onChange(`${country.code}${next.replace(/\D/g, "")}`)} style={s.input} />
    </View>{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    {open ? <Modal transparent visible animationType="fade" onRequestClose={() => setOpen(false)}><View style={s.portal}><Pressable accessibilityLabel="Close country calling code list" onPress={() => setOpen(false)} style={s.backdrop} /><View style={[s.dropdown, { left: Math.max(8, anchor.x), top: above ? Math.max(8, anchor.y - 320) : anchor.y + anchor.height }]}><TextInput accessibilityLabel="Search country or calling code" value={query} onChangeText={setQuery} placeholder="Search country or code" placeholderTextColor={colors.textSecondary} style={s.search} autoFocus /><ScrollView keyboardShouldPersistTaps="handled" style={s.list}>{results.map((item) => <Pressable key={item.iso} accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.code}`} onPress={() => choose(item)} style={s.option}><CountryFlag iso={item.iso} /><Text numberOfLines={1} style={s.optionName}>{item.name}</Text><Text style={s.optionCode}>{item.code}</Text>{item.iso === country.iso ? <Text style={s.check}>✓</Text> : <View style={s.checkSpace} />}</Pressable>)}</ScrollView></View></View></Modal> : null}
  </View>;
}
const s = StyleSheet.create({ box: { gap: space.xs }, openBox: { zIndex: 20 }, label: { ...type.body, fontWeight: "600", color: colors.text }, control: { minHeight: 52, flexDirection: "row", borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, overflow: "hidden" }, invalid: { borderColor: colors.error }, codeButton: { minWidth: 116, paddingHorizontal: space.md, flexDirection: "row", alignItems: "center", justifyContent:"center", gap: 6, borderRightWidth: 1, borderRightColor: colors.border }, code: { ...type.body, color: colors.text, fontWeight: "600", flex:1 }, input: { flex: 1, paddingHorizontal: space.md, color: colors.text, ...type.body }, error: { ...type.secondary, color: colors.error }, portal: { flex: 1, backgroundColor: "transparent" }, backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "transparent" }, dropdown: { position: "absolute", width: 304, maxWidth: "96%", maxHeight: 300, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden", ...shadow, elevation: 30 }, search: { minHeight: 46, paddingHorizontal: space.md, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.separator, ...type.body }, list: { maxHeight: 250 }, option: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.md, borderBottomWidth: 1, borderBottomColor: colors.separator }, optionName: { ...type.body, color: colors.text, flex: 1 }, optionCode: { ...type.body, color: colors.textSecondary }, check: { color: colors.primary, fontSize: 18, fontWeight: "700", width: 20, textAlign: "right" }, checkSpace: { width: 20 } });
