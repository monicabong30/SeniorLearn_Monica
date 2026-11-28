import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, space, type } from "../theme/tokens";
import { compactReadableDate, dateOnly, localDateOnly, readableDate } from "../lib/registration";
import { MonthYearWheelPicker, monthNames } from "./MonthYearWheelPicker";
import { DismissibleModal } from "./DismissibleModal";
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  pad = (n: number) => String(n).padStart(2, "0");
export function DatePickerField({
  value,
  onChange,
  error,
  label = "Date",
  maximumDate,
  minimumDate,
  compact = false,
  placeholder,
}: {
  value?: string | null;
  onChange: (v: string) => void;
  error?: string;
  label?: string;
  maximumDate?: string | null;
  minimumDate?: string | null;
  /** Use a shorter value in constrained layouts; the picker itself stays unchanged. */
  compact?: boolean;
  placeholder?: string;
}) {
  // Keep date-only values in local time. Parsing at noon prevents a UTC offset
  // from changing the calendar day shown to the user.
  const today = localDateOnly(),
    selectedValue = typeof value === "string" && dateOnly(value) ? value : undefined,
    requestedMin = typeof minimumDate === "string" && dateOnly(minimumDate) ? minimumDate : undefined,
    // Class schedules must never be placed in the past. Other uses (such as
    // date of birth and historical filters) retain their supplied bounds.
    scheduleMinimum = /class date/i.test(label) ? today : undefined,
    requestedMax = typeof maximumDate === "string" && dateOnly(maximumDate) ? maximumDate : undefined,
    minCandidate = requestedMin ?? scheduleMinimum,
    min = minCandidate && (!requestedMax || minCandidate <= requestedMax) ? minCandidate : undefined,
    max = requestedMax && (!requestedMin || requestedMin <= requestedMax) ? requestedMax : undefined,
    initialValue = selectedValue ?? min ?? max,
    initial = initialValue ? new Date(`${initialValue}T12:00:00`) : new Date(),
    [open, setOpen] = useState(false),
    [year, setYear] = useState(initial.getFullYear()),
    [month, setMonth] = useState(initial.getMonth()),
    [monthOpen, setMonthOpen] = useState(false);
  useEffect(() => {
    if (open) {
      const focusDate = selectedValue && (!min || selectedValue >= min) && (!max || selectedValue <= max)
        ? selectedValue
        : min ?? max;
      if (!focusDate) return;
      const d = new Date(`${focusDate}T12:00:00`);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  }, [open, selectedValue, min, max]);
  // An omitted maximum means all calendar dates are selectable. This is required
  // by shared future-date pickers; DOB supplies a concrete maximum below.
  const todayYear = new Date().getFullYear(),
    maxYear = Math.max(max ? Number(max.slice(0, 4)) : todayYear + 20, min ? Number(min.slice(0, 4)) : 0),
    minYear = min ? Number(min.slice(0, 4)) : Math.min(1900, year, maxYear),
    years = useMemo(
      () =>
        Array.from(
          { length: Math.max(1, maxYear - minYear + 1) },
          (_, i) => maxYear - i,
        ),
      [maxYear, minYear],
    ),
    days = useMemo(
      () =>
        Array.from(
          { length: new Date(year, month + 1, 0).getDate() },
          (_, i) => i + 1,
        ),
      [year, month],
    ),
    offset = new Date(year, month, 1).getDay(),
    valid = (day: number) => {
      const date = `${year}-${pad(month + 1)}-${pad(day)}`;
      return (!min || date >= min) && (!max || date <= max);
    },
    previousDisabled = year === minYear && month === 0 || Boolean(min && year === Number(min.slice(0, 4)) && month === Number(min.slice(5, 7)) - 1),
    nextDisabled = year === maxYear && month === 11 || Boolean(max && year === Number(max.slice(0, 4)) && month === Number(max.slice(5, 7)) - 1);
  return (
    <View style={s.box}>
      <Text style={s.label} children={label} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label}${error ? `, error: ${error}` : ""}`}
        onPress={() => setOpen(true)}
        style={[s.control, error && s.invalid]}
      >
        <Text numberOfLines={1} style={[selectedValue ? s.value : s.placeholder, s.controlText]} children={selectedValue ? (compact ? compactReadableDate(selectedValue) : readableDate(selectedValue)) : (placeholder || "DD/MM/YYYY")} />
        <Ionicons accessible={false} name="calendar-outline" size={18} color={colors.primary} />
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={s.error} children={error} />
      )}
      <DismissibleModal visible={open} animationType="fade" onDismiss={() => setOpen(false)} backdropStyle={s.back} accessibilityLabel={`Close ${label.toLowerCase()} calendar`}>
          <View style={s.modal}>
            <Text accessibilityRole="header" style={s.title} children={`Choose ${label.toLowerCase()}`} />
            <View style={s.calendarHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={previousDisabled} onPress={() => { if (month === 0) { setMonth(11); setYear((v) => v - 1); } else setMonth((v) => v - 1); }} style={s.arrow}>
              <Text style={s.arrowText} children="〈" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select month and year"
              onPress={() => setMonthOpen(true)}
              style={s.monthYear}
            >
              <Text style={s.monthYearText} children={`${monthNames[month]} ${year}`} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={nextDisabled} onPress={() => { if (month === 11) { setMonth(0); setYear((v) => v + 1); } else setMonth((v) => v + 1); }} style={s.arrow}>
              <Text style={s.arrowText} children="〉" />
            </Pressable>
            </View>
            <View style={s.week}>
              {weekdays.map((x) => (
                <Text key={x} style={s.weekText} children={x} />
              ))}
            </View>
            <View style={s.days}>
              {Array.from({ length: offset }, (_, i) => (
                <View key={`blank${i}`} style={s.day} />
              ))}
              {days.map((day) => {
                const date = `${year}-${pad(month + 1)}-${pad(day)}`;
                const isToday = date === today;
                const isSelected = selectedValue === date;
                return <Pressable
                  disabled={!valid(day)}
                  key={day}
                  accessibilityLabel={`${day} ${monthNames[month]} ${year}${isToday ? ", today" : ""}`}
                  onPress={() => {
                    onChange(`${year}-${pad(month + 1)}-${pad(day)}`);
                    setOpen(false);
                  }}
                  style={[
                    s.day, isToday && s.dayToday, isSelected && s.daySelected,
                  ]}
                >
                  <Text style={[s.dayText, !valid(day) && s.disabledText, isSelected && s.daySelectedText]} children={String(day)} />
                </Pressable>
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={s.cancel}
            >
              <Text style={s.cancelText} children="Cancel" />
            </Pressable>
          </View>
      </DismissibleModal>
      {monthOpen ? <MonthYearWheelPicker visible month={month} year={year} minYear={minYear} maxYear={maxYear} onDismiss={() => setMonthOpen(false)} onDone={(nextMonth, nextYear) => { setMonth(nextMonth); setYear(nextYear); setMonthOpen(false); }} /> : null}
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
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  value: { ...type.body, color: colors.text },
  placeholder: { ...type.body, color: colors.textSecondary },
  controlText: { flex: 1, flexShrink: 1 },
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
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  monthYear: { padding: space.sm },
  monthYearText: { ...type.section, color: colors.primary },
  arrow: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  arrowText: { ...type.section, color: colors.primary },
  week: { flexDirection: "row" },
  weekText: {
    width: "14.285%",
    textAlign: "center",
    fontWeight: "700",
    color: colors.textSecondary,
    fontSize: 12,
  },
  days: { flexDirection: "row", flexWrap: "wrap" },
  day: {
    width: "14.285%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
  },
  dayText: { color: colors.text },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 2, borderColor: colors.primary },
  daySelectedText: { color: "#fff", fontWeight: "700" },
  disabledText: { color: colors.disabled },
  cancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  cancelText: { color: colors.primary, fontWeight: "700" },
  wheels: { flexDirection: "row", gap: space.md },
  wheelBox: { flex: 1, alignItems: "center" },
  wheelTitle: { fontWeight: "700" },
  wheel: { height: 170, width: "100%" },
  wheelRow: {
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  wheelSelected: { backgroundColor: colors.primary },
  wheelText: { color: colors.textSecondary },
  wheelTextSelected: { color: "#fff", fontWeight: "700" },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  done: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  doneText: { color: "#fff", fontWeight: "700" },
});
