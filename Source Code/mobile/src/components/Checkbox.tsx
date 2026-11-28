import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, space, type } from "../theme/tokens";
import { ScaledText as Text } from "./ScaledText";

export function Checkbox({ checked, label, onChange, error }: { checked: boolean; label: string; onChange: (next: boolean) => void; error?: string }) {
  return <View style={s.wrap}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityHint={error} onPress={() => onChange(!checked)} style={s.row}><View style={[s.box, checked && s.checked]}>{checked && <Ionicons name="checkmark" size={17} color="#fff" />}</View><Text style={s.label}>{label}</Text></Pressable>{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}</View>;
}
const s = StyleSheet.create({ wrap: { gap: space.xs }, row: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.sm }, box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, checked: { backgroundColor: colors.primary, borderColor: colors.primary }, label: { ...type.body, flex: 1, color: colors.text }, error: { ...type.secondary, color: colors.error } });
