import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton, Card } from "./ui";
import { DatePickerField } from "./DatePickerField";
import { ScaledText as Text } from "./ScaledText";
import { colors, space, type } from "../theme/tokens";
import { DismissibleModal } from "./DismissibleModal";

export type DateFilterValue = { type: string; startDate: string; endDate: string; label?: string };
const quicks = ["Any time", "Last 7 days", "Last 30 days", "This month", "Custom"];
const day = (value: Date) => value.toISOString().slice(0, 10);

export function DateFilterModal({ types, value, onChange, title = "Filter by Date" }: { types: readonly string[]; value: DateFilterValue; onChange: (value: DateFilterValue) => void; title?: string }) {
  const [open, setOpen] = useState(false), [draft, setDraft] = useState<DateFilterValue>(value);
  const dismiss = () => { setDraft(value); setOpen(false); };
  const invalid = !!(draft.startDate && draft.endDate && draft.startDate > draft.endDate);
  const custom = draft.label === "Custom" || (!draft.label && !!draft.startDate);
  const summary = value.label && value.label !== "Custom" ? `${types.length > 1 ? `${value.type.replace(" Date", "")}: ` : ""}${value.label}` : value.startDate ? `${types.length > 1 ? `${value.type.replace(" Date", "")}: ` : ""}${value.startDate} – ${value.endDate}` : "";
  const choose = (label: string) => { const today = new Date(), start = new Date(today); if (label === "Last 7 days") start.setDate(today.getDate() - 6); if (label === "Last 30 days") start.setDate(today.getDate() - 29); if (label === "This month") start.setDate(1); setDraft(current => ({ ...current, startDate: label === "Any time" ? "" : day(start), endDate: label === "Any time" ? "" : day(today), label })); };
  return <>
    <Pressable accessibilityRole="button" onPress={() => { setDraft(value); setOpen(true); }} style={s.button}><Ionicons name="calendar-outline" size={20} color={colors.primary} /><Text style={s.buttonText}>Date Filter</Text><Ionicons name="chevron-forward" size={18} color={colors.primary} /></Pressable>
    {summary ? <Pressable accessibilityRole="button" accessibilityLabel="Clear date filter" onPress={() => onChange({ type: value.type, startDate: "", endDate: "" })} style={s.summary}><Text style={s.summaryText}>{summary}</Text><Ionicons name="close" size={16} color={colors.primary} /></Pressable> : null}
    <DismissibleModal visible={open} animationType="slide" onDismiss={dismiss} backdropStyle={s.overlay} accessibilityLabel="Close date filter">
      <Card style={s.modal}>
        <View style={s.header}><Text style={s.title}>{title}</Text></View>
        <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {types.length > 1 ? <View style={s.group}><Text style={s.section}>Date Type</Text><Chips values={[...types]} value={draft.type} onChange={type => setDraft(current => ({ ...current, type }))} /></View> : null}
          <View style={s.group}><Text style={s.section}>Date Range</Text><Chips values={quicks} value={draft.label || "Custom"} onChange={choose} /></View>
          {custom ? <View style={s.dates}><DatePickerField label="Start Date" placeholder="DD/MM/YYYY" value={draft.startDate} maximumDate={draft.endDate || undefined} onChange={startDate => setDraft(current => ({ ...current, startDate, label: "Custom" }))} /><DatePickerField label="End Date" placeholder="DD/MM/YYYY" value={draft.endDate} minimumDate={draft.startDate || undefined} onChange={endDate => setDraft(current => ({ ...current, endDate, label: "Custom" }))} /></View> : null}
        </ScrollView>
        <View style={s.footer}><View style={s.reset}><AppButton label="Reset" variant="outline" onPress={() => setDraft({ type: types[0], startDate: "", endDate: "" })} /></View><View style={s.apply}><AppButton label="Apply Filters" disabled={invalid} onPress={() => { onChange(draft); setOpen(false); }} /></View></View>
      </Card>
    </DismissibleModal>
  </>;
}

function Chips({ values, value: selected, onChange }: { values: string[]; value: string; onChange: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipScroller} keyboardShouldPersistTaps="handled">{values.map(option => <Pressable key={option} onPress={() => onChange(option)} style={[s.chip, option === selected && s.chipSelected]}><Text style={[s.chipText, option === selected && s.chipSelectedText]}>{option}</Text></Pressable>)}</ScrollView>;
}

const s = StyleSheet.create({
  button: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.md, borderRadius: 12, backgroundColor: colors.elevatedSurface }, buttonText: { flex: 1, color: colors.primary, fontWeight: "700" }, summary: { flexDirection: "row", alignItems: "center", gap: space.xs, alignSelf: "flex-start", backgroundColor: "#E6F0FF", borderRadius: 18, paddingHorizontal: space.md, paddingVertical: space.xs }, summaryText: { color: colors.primary, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,.35)", justifyContent: "flex-end", paddingHorizontal: space.md, paddingTop: space.xl, paddingBottom: space.xl }, modal: { width: "100%", maxWidth: 600, maxHeight: "92%", alignSelf: "center", paddingBottom: space.md, gap: 0 }, header: { paddingBottom: space.md }, title: { ...type.section, color: colors.primary }, body: { flexGrow: 0, flexShrink: 1 }, bodyContent: { gap: space.lg, paddingBottom: space.lg }, group: { gap: space.sm }, section: { fontWeight: "700", color: colors.text }, chipScroller: { flexGrow: 0 }, chips: { gap: space.sm, paddingVertical: 2, paddingRight: space.md, alignItems: "center" }, chip: { minHeight: 44, paddingHorizontal: space.md, paddingVertical: space.xs, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: colors.elevatedSurface }, chipSelected: { backgroundColor: colors.primary }, chipText: { color: colors.text, fontWeight: "600", textAlignVertical: "center" }, chipSelectedText: { color: "#fff" }, dates: { gap: space.md }, footer: { flexDirection: "row", gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.separator }, reset: { width: 116 }, apply: { flex: 1 },
});
