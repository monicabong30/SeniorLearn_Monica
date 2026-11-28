import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import { AppButton, Card, Field, PageTitle } from "../../src/components/ui";
import { DatePickerField } from "../../src/components/DatePickerField";
import { TimePickerField } from "../../src/components/TimePickerField";
import { NumberInputField } from "../../src/components/NumberInputField";
import { ConfirmationDialog } from "../../src/components/ConfirmationDialog";
import { KeyboardAwareScrollView } from "../../src/components/KeyboardAwareScrollView";
import { colors, space } from "../../src/theme/tokens";
import { useFormSubmitState } from "../../src/hooks/useFormSubmitState";
import { useUnsavedChangesGuard } from "../../src/hooks/useUnsavedChangesGuard";
import { localDateOnly } from "../../src/lib/registration";
import {
  durationBetween,
  durationLabel,
  MINIMUM_CLASS_CAPACITY,
  validateClassForm,
} from "../../src/lib/scheduling";
export default function CreateClass() {
  const router = useRouter(),
    [f, setF] = useState({
      title: "",
      description: "",
      date: "2027-02-01",
      startTime: "10:00",
      endTime: "11:00",
      capacity: "12",
      teamsLink: "https://teams.microsoft.com/l/meetup-join/example",
    }),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [pending, setPending] = useState(false),
    { show } = useFeedback();
  const set = (k: keyof typeof f, v: string) => {
    setF({ ...f, [k]: v });
    setErrors((current) => {
      const next = { ...current };
      delete next[k];
      if (k === "startTime" || k === "endTime") delete next.endTime;
      return next;
    });
  };
  const validate=useCallback((values:typeof f)=>validateClassForm(values),[]);
  const form=useFormSubmitState({initialValues:f,values:f,validate,isSubmitting:pending,mode:"create"});
  const navigationGuard=useUnsavedChangesGuard(form.isDirty,pending);
  const save = async () => {
    const validation = form.errors;
    if (Object.keys(validation).length) {
      setErrors(validation);
      if (validation.endTime) Alert.alert("Invalid Class Time", "The end time must be later than the start time.", [{ text: "Change Time" }]);
      return;
    }
    try {
      setPending(true);
      await api.post("/classes", {
        ...f,
        startsAt: new Date(`${f.date}T${f.startTime}:00`).toISOString(),
        durationMinutes: durationBetween(f.startTime, f.endTime),
        capacity: Number(f.capacity),
        delivery: "ONLINE",
        status: "DRAFT",
      });
      show("SUCCESS", "Class created successfully.", () => router.replace("/(tabs)/tutor"));
    } catch {
      show("ERROR", "Unable to save class changes.");
    } finally {
      setPending(false);
    }
  };
  const duration = durationBetween(f.startTime, f.endTime);
  return (
    <KeyboardAwareScrollView contentContainerStyle={s.page}>
      <PageTitle
        title="Create class"
        subtitle="Save a draft, then publish it from your dashboard."
      />
      <Card>
        <Field
          label="Class title"
          placeholder="e.g. Introduction to Digital Photography"
          value={f.title}
          error={errors.title}
          onChangeText={(v) => set("title", v)}
        />
        <Field
          label="Description"
          placeholder="e.g. Learn basic photography skills"
          value={f.description}
          error={errors.description}
          onChangeText={(v) => set("description", v)}
          multiline
        />
        <DatePickerField
          label="Class date"
          placeholder="DD/MM/YYYY"
          minimumDate={localDateOnly()}
          value={f.date}
          error={errors.date}
          onChange={(v) => set("date", v)}
        />
        <View style={s.times}><View style={s.timeField}><TimePickerField label="Start time" placeholder="Select start time" value={f.startTime} error={errors.startTime} onChange={(v) => set("startTime", v)} /></View><View style={s.timeField}><TimePickerField label="End time" placeholder="Select end time" value={f.endTime} error={errors.endTime || (duration <= 0 ? "End time must be later than start time." : undefined)} onChange={(v) => set("endTime", v)} /></View></View>
        <Text style={s.duration}>
          Duration —{" "}
          {duration > 0 ? durationLabel(duration) : "Select a valid time range"}
        </Text>
        <NumberInputField
          label="Capacity"
          placeholder="e.g. 20"
          minimum={MINIMUM_CLASS_CAPACITY}
          required
          error={errors.capacity}
          value={f.capacity}
          onChangeText={(v) => set("capacity", v)}
        />
        <Field
          label="Microsoft Teams link"
          placeholder="https://teams.microsoft.com/..."
          error={errors.teamsLink}
          value={f.teamsLink}
          onChangeText={(v) => set("teamsLink", v)}
        />
      </Card>
      <Text style={s.note}>
        Date and time are saved in your device's local time.
      </Text>
      <AppButton label="Save draft" loading={pending} disabled={!form.canSubmit} onPress={save} />
      <AppButton label="Cancel" variant="outline" disabled={pending} onPress={() => router.back()} />
      <ConfirmationDialog visible={navigationGuard.discardConfirmationVisible} title="Discard changes?" message="Your unsaved changes will be lost." confirmLabel="Discard changes" cancelLabel="Keep editing" variant="destructive" onDismiss={navigationGuard.keepEditing} onConfirm={navigationGuard.discard} />
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
  note: { color: colors.textSecondary },
  duration: { color: colors.primary, fontWeight: "700" },
  times: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
  timeField: { flexGrow: 1, flexBasis: 220 },
});
