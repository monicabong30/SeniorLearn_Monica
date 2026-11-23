import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import { AppButton, Card, Field, PageTitle } from "../../src/components/ui";
import { DatePickerField } from "../../src/components/DatePickerField";
import { TimePickerField } from "../../src/components/TimePickerField";
import { KeyboardAwareScrollView } from "../../src/components/KeyboardAwareScrollView";
import { colors, space } from "../../src/theme/tokens";
import { useFormSubmitState } from "../../src/hooks/useFormSubmitState";
import {
  durationBetween,
  durationLabel,
  validateClassForm,
} from "../../src/lib/scheduling";
export default function RecurringCreate() {
  const router = useRouter(),
    { show } = useFeedback(),
    [f, setF] = useState({
      title: "",
      description: "",
      date: "2027-07-01",
      startTime: "10:00",
      endTime: "11:00",
      endDate: "2027-08-01",
      capacity: "12",
      teamsLink: "https://teams.microsoft.com/l/meetup-join/example",
      frequency: "WEEKLY",
    }),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [pending, setPending] = useState(false);
  const set = (k: keyof typeof f, v: string) => {
    setF({ ...f, [k]: v });
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      if (k === "startTime" || k === "endTime") delete n.endTime;
      return n;
    });
  };
  const validate=useCallback((values:typeof f)=>{const errors=validateClassForm(values);if(values.endDate<values.date)errors.endDate="Last date must be after first date.";return errors;},[]);
  const form=useFormSubmitState({initialValues:f,values:f,validate,isSubmitting:pending,mode:"create"});
  const save = async () => {
    const validation = form.errors;
    if (Object.keys(validation).length) {
      setErrors(validation);
      if (validation.endTime) Alert.alert("Invalid Class Time", "The end time must be later than the start time.", [{ text: "Change Time" }]);
      return;
    }
    try {
      setPending(true);
      await api.post("/classes/recurring", {
        ...f,
        startsAt: new Date(`${f.date}T${f.startTime}:00`).toISOString(),
        endDate: new Date(`${f.endDate}T23:59:59`).toISOString(),
        capacity: Number(f.capacity),
        durationMinutes: durationBetween(f.startTime, f.endTime),
        delivery: "ONLINE",
        status: "DRAFT",
        weekdays: [],
      });
      show("SUCCESS", "Recurring classes created successfully.");
      router.replace("/(tabs)/tutor");
    } catch {
      show("ERROR", "Unable to create recurring classes.");
    } finally {
      setPending(false);
    }
  };
  const duration = durationBetween(f.startTime, f.endTime);
  return (
    <KeyboardAwareScrollView contentContainerStyle={s.page}>
      <PageTitle
        title="Create recurring classes"
        subtitle="Choose a simple schedule. Each class starts as a draft."
      />
      <Card>
        <Field
          label="Class title"
          value={f.title}
          error={errors.title}
          onChangeText={(v) => set("title", v)}
        />
        <Field
          label="Description"
          value={f.description}
          error={errors.description}
          onChangeText={(v) => set("description", v)}
          multiline
        />
        <DatePickerField
          label="First class date"
          value={f.date}
          error={errors.date}
          onChange={(v) => set("date", v)}
        />
        <View style={s.times}><View style={s.timeField}><TimePickerField label="Start time" value={f.startTime} error={errors.startTime} onChange={(v) => set("startTime", v)} /></View><View style={s.timeField}><TimePickerField label="End time" value={f.endTime} error={errors.endTime || (duration <= 0 ? "End time must be later than start time." : undefined)} onChange={(v) => set("endTime", v)} /></View></View>
        <Text style={s.duration}>
          Duration —{" "}
          {duration > 0 ? durationLabel(duration) : "Select a valid time range"}
        </Text>
        <DatePickerField
          label="Last class date"
          value={f.endDate}
          error={errors.endDate}
          onChange={(v) => set("endDate", v)}
        />
        <Field
          label="Capacity"
          error={errors.capacity}
          keyboardType="number-pad"
          value={f.capacity}
          onChangeText={(v) => set("capacity", v)}
        />
      </Card>
      <Text style={s.label}>
        Repeats {f.frequency === "WEEKLY" ? "weekly" : "every two weeks"}
      </Text>
      <View style={s.options}>
        <AppButton
          label="Weekly"
          variant={f.frequency === "WEEKLY" ? "primary" : "outline"}
          onPress={() => set("frequency", "WEEKLY")}
        />
        <AppButton
          label="Every two weeks"
          variant={f.frequency === "BIWEEKLY" ? "primary" : "outline"}
          onPress={() => set("frequency", "BIWEEKLY")}
        />
      </View>
      <AppButton
        label="Create recurring drafts"
        loading={pending}
        disabled={!form.canSubmit}
        onPress={save}
      />
    </KeyboardAwareScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: space.lg,
    gap: space.lg,
    backgroundColor: colors.background,
  },
  label: { color: colors.text, fontWeight: "700" },
  options: { gap: space.sm },
  duration: { color: colors.primary, fontWeight: "700" },
  times: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
  timeField: { flexGrow: 1, flexBasis: 220 },
});
