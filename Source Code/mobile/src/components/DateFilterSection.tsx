import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { DatePickerField } from "./DatePickerField";
import { ScaledText as Text } from "./ScaledText";
import { colors, space, type } from "../theme/tokens";

export type DateFilterValue = { type: string; startDate: string; endDate: string };

export function DateFilterSection({ types, value, onChange, showTypes = true }: { types: readonly string[]; value: DateFilterValue; onChange: (value: DateFilterValue) => void; showTypes?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const active = Boolean(value.startDate || value.endDate);
  const invalid = Boolean(value.startDate && value.endDate && value.startDate > value.endDate);
  const clear = () => onChange({ type: types[0], startDate: "", endDate: "" });
  return <View style={s.box}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Filter by Date${active ? ", active" : ""}, ${expanded ? "expanded" : "collapsed"}`} accessibilityState={{ expanded }} onPress={() => setExpanded(open => !open)} style={s.header}>
      <View style={s.headerStart}><Ionicons accessible={false} name="calendar-outline" size={19} color={colors.primary}/><Text style={s.headerText}>Filter by Date</Text></View>
      <View style={s.headerEnd}>{active && <Text accessibilityLabel="1 active date filter" style={s.active}>1 Active</Text>}<Text style={s.chevron}>{expanded ? "⌃" : "⌄"}</Text></View>
    </Pressable>
    {expanded && <View style={s.content}>
      {showTypes && types.length > 1 && <><Text style={s.label}>Date Type</Text>
      <View style={s.types}>{types.map(type => <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: value.type === type }} onPress={() => onChange({ ...value, type })} style={[s.type, value.type === type && s.selected]}><Text style={value.type === type ? s.selectedText : undefined}>{type}</Text></Pressable>)}</View></>}
      <View style={s.dates}>
        <View style={s.dateField}><DatePickerField compact label="Start Date" value={value.startDate} maximumDate={value.endDate} onChange={startDate => onChange({ ...value, startDate })}/></View>
        <View style={s.dateField}><DatePickerField compact label="End Date" value={value.endDate} minimumDate={value.startDate} onChange={endDate => onChange({ ...value, endDate })}/></View>
      </View>
      {invalid && <Text accessibilityRole="alert" style={s.error}>Start Date must be on or before End Date.</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel="Clear Dates" disabled={!active} onPress={clear} style={[s.clear, !active && s.clearDisabled]}><Text style={[s.clearText, !active && s.clearTextDisabled]}>Clear Dates</Text></Pressable>
    </View>}
  </View>;
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  header: { minHeight: 48, paddingHorizontal: space.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  headerStart: { flexDirection: "row", alignItems: "center", gap: space.sm, flexShrink: 1 }, headerText: { ...type.body, fontWeight: "700", color: colors.primary }, headerEnd: { flexDirection: "row", alignItems: "center", gap: space.sm },
  chevron: { color: colors.primary, fontSize: 22 }, active: { color: colors.primary, backgroundColor: "#E6F1FA", borderRadius: 10, paddingHorizontal: space.sm, paddingVertical: 3, fontWeight: "700", fontSize: 12 },
  content: { borderTopWidth: 1, borderTopColor: colors.border, padding: space.md, gap: space.sm }, label: { ...type.body, fontWeight: "600", color: colors.text },
  types: { flexDirection: "row", flexWrap: "wrap", gap: space.xs }, type: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 22 }, selected: { backgroundColor: colors.primary, borderColor: colors.primary }, selectedText: { color: "#fff", fontWeight: "700" },
  dates: { flexDirection: "row", gap: space.md, alignItems: "flex-start" }, dateField: { flex: 1, minWidth: 0 }, error: { color: colors.error, ...type.secondary }, clear: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm }, clearDisabled: { opacity: .45 }, clearText: { color: colors.primary, fontWeight: "700" }, clearTextDisabled: { color: colors.textSecondary },
});
