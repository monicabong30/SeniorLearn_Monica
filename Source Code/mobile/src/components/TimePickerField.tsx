import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { colors, space, type } from "../theme/tokens";
import { timeFromParts, timeParts } from "../lib/scheduling";
import { ScaledText as Text } from "./ScaledText";

const ROW = 48,
  pad = (n: number) => String(n).padStart(2, "0");
const hours = Array.from({ length: 12 }, (_, i) => i + 1),
  minutes = [0, 15, 30, 45];
function Wheel({
  label,
  values,
  value,
  onPick,
  format = (x: any) => String(x),
}: {
  label: string;
  values: any[];
  value: any;
  onPick: (v: any) => void;
  format?: (v: any) => string;
}) {
  const ref = useRef<any>(null);
  const index = Math.max(0, values.indexOf(value));
  const align = () =>
    ref.current?.scrollTo({ y: index * ROW, animated: false });
  return (
    <View style={s.wheelBox}>
      <Text style={s.wheelLabel}>{label}</Text>
      <ScrollView
        ref={ref}
        onLayout={align}
        style={s.wheel}
        contentContainerStyle={s.wheelContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={ROW}
        decelerationRate="fast"
        accessibilityLabel={`${label} selector`}
      >
        {values.map((item) => (
          <Pressable
            key={String(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: item === value }}
            onPress={() => onPick(item)}
            style={[s.row, item === value && s.rowSelected]}
          >
            <Text style={[s.rowText, item === value && s.rowTextSelected]}>
              {format(item)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
export function TimePickerField({
  label = "Time",
  value,
  onChange,
  error,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(timeParts(value || "09:00"));
  const openPicker = () => {
    setDraft(timeParts(value || "09:00"));
    setOpen(true);
  };
  useEffect(() => {
    if (!open) setDraft(timeParts(value || "09:00"));
  }, [value, open]);
  const set = (key: "hour" | "minute" | "period", next: number | string) =>
    setDraft((current) => ({ ...current, [key]: next }));
  return (
    <View style={s.box}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label}${error ? `, error: ${error}` : ""}`}
        onPress={openPicker}
        style={[s.control, error && s.invalid]}
      >
        <Text style={s.value}>
          {value
            ? `${draft.hour}:${pad(draft.minute)} ${draft.period}`
            : "Choose a time"}
        </Text>
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.back}>
          <View accessibilityViewIsModal style={s.modal}>
            <Text accessibilityRole="header" style={s.title}>
              Choose {label.toLowerCase()}
            </Text>
            <View style={s.wheels}>
              <Wheel
                label="Hour"
                values={hours}
                value={draft.hour}
                onPick={(hour) => set("hour", hour)}
                format={(x) => pad(x)}
              />
              <Wheel
                label="Minute"
                values={minutes}
                value={draft.minute}
                onPick={(minute) => set("minute", minute)}
                format={(x) => pad(x)}
              />
              <Wheel
                label="AM/PM"
                values={["AM", "PM"]}
                value={draft.period}
                onPick={(period) => set("period", period)}
              />
            </View>
            <View style={s.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={s.action}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(
                    timeFromParts(draft.hour, draft.minute, draft.period),
                  );
                  setOpen(false);
                }}
                style={s.done}
              >
                <Text style={s.doneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  box: { gap: space.xs },
  label: { ...type.body, fontWeight: "600", color: colors.text },
  control: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: space.md,
    justifyContent: "center",
  },
  value: { ...type.body, color: colors.text },
  invalid: { borderColor: colors.error },
  error: { ...type.secondary, color: colors.error },
  back: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.35)",
    justifyContent: "center",
    padding: space.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: space.lg,
    gap: space.md,
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },
  title: { ...type.section, color: colors.primary },
  wheels: { flexDirection: "row", gap: space.sm },
  wheelBox: { flex: 1, alignItems: "center" },
  wheelLabel: { fontWeight: "700", color: colors.text },
  wheel: { height: 156, width: "100%", marginTop: space.xs },
  wheelContent: { paddingVertical: 54 },
  row: {
    height: ROW,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  rowSelected: { backgroundColor: colors.primary },
  rowText: { color: colors.textSecondary, fontWeight: "600" },
  rowTextSelected: { color: "#fff", fontSize: 18 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: space.sm },
  action: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    justifyContent: "center",
  },
  done: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  cancelText: { color: colors.primary, fontWeight: "700" },
  doneText: { color: "#fff", fontWeight: "700" },
});
