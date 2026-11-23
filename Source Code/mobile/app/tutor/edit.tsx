import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useAuth } from "../../src/context/Auth";
import { canAdmin } from '../../src/lib/permissions';
import { useFeedback } from "../../src/context/Feedback";
import { api, errorMessage } from "../../src/lib/api";
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
const datePart = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  timePart = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  },
  add = (time: string, duration: number) => {
    const [h, m] = time.split(":").map(Number),
      v = h * 60 + m + duration;
    return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
  };
export default function EditClass() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    router = useRouter(),
    { user } = useAuth(),
    { show } = useFeedback(),
    [f, setF] = useState<any>(),
    [initial, setInitial] = useState<any>(),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [pending, setPending] = useState(false);
  useEffect(() => {
    void api
      .get(`/classes/${id}`)
      .then((r) => {
        const c = r.data.class;
        if (c.tutor?.id && c.tutor.id !== user?.id && !canAdmin(user))
          throw Error();
        const start = timePart(c.startsAt);
        const next={
          ...c,
          date: datePart(c.startsAt),
          startTime: start,
          endTime: add(start, c.durationMinutes),
          capacity: String(c.capacity),
        };setF(next);setInitial(next);
      })
      .catch(() => show("ERROR", "You cannot edit this class."));
  }, [id, user?.id, user?.isAdmin]);
  const emptyForm={title:"",description:"",date:"",startTime:"",endTime:"",capacity:"",teamsLink:""};
  const validate=useCallback((values:any)=>validateClassForm(values),[]);
  const form=useFormSubmitState({initialValues:initial||f||emptyForm,values:f||emptyForm,validate,isSubmitting:pending,mode:"edit",normalize:(v:any)=>({title:v.title.trim(),description:v.description.trim(),date:v.date,startTime:v.startTime,endTime:v.endTime,capacity:String(v.capacity).trim(),teamsLink:String(v.teamsLink||"").trim()})});
  if (!f)
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
        <Text>Loading class…</Text>
      </View>
    );
  const set = (k: string, v: string) => {
    setF((current:any)=>({ ...current, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      if (k === "startTime" || k === "endTime") delete n.endTime;
      return n;
    });
  };
  const save = async () => {
    if (!form.canSubmit) { setErrors(form.errors); return; }
    const validation = form.errors;
    if (Object.keys(validation).length) {
      setErrors(validation);
      if (validation.endTime) Alert.alert("Invalid Class Time", "The end time must be later than the start time.", [{ text: "Change Time" }]);
      return;
    }
    try {
      setPending(true);
      const patch = {
        title: f.title,
        description: f.description,
        startsAt: new Date(`${f.date}T${f.startTime}:00`).toISOString(),
        capacity: Number(f.capacity),
        durationMinutes: durationBetween(f.startTime, f.endTime),
        // Do not send undefined optional fields. Zod correctly rejects an
        // explicit undefined value, while an omitted field preserves it.
        ...(f.delivery ? { delivery: f.delivery } : {}),
        ...(f.teamsLink?.trim() ? { teamsLink: f.teamsLink.trim() } : {}),
        ...(f.address?.trim() ? { address: f.address.trim() } : {}),
      };
      await api.put(`/classes/${id}`, patch);
      setInitial(f);
      show("SUCCESS", "Class updated successfully.");
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/tutor");
    } catch (error) {
      show("ERROR", errorMessage(error));
    } finally {
      setPending(false);
    }
  };
  const duration = durationBetween(f.startTime, f.endTime);
  return (
    <KeyboardAwareScrollView contentContainerStyle={s.page}>
      <PageTitle
        title="Edit class"
        subtitle="Update the details learners will see."
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
          label="Class date"
          value={f.date}
          error={errors.date}
          onChange={(v) => set("date", v)}
        />
          <View style={s.times}><View style={s.timeField}><TimePickerField label="Start time" value={f.startTime} error={errors.startTime} onChange={(v) => set("startTime", v)} /></View><View style={s.timeField}><TimePickerField label="End time" value={f.endTime} error={errors.endTime || (duration <= 0 ? "End time must be later than start time." : undefined)} onChange={(v) => set("endTime", v)} /></View></View>
        <Text style={s.duration}>
          Duration —{" "}
          {duration > 0 ? durationLabel(duration) : "Select a valid time range"}
        </Text>
        <Field
          label="Capacity"
          error={errors.capacity}
          keyboardType="number-pad"
          value={String(f.capacity || "")}
          onChangeText={(v) => set("capacity", v)}
        />
        <Field
          label="Microsoft Teams link"
          error={errors.teamsLink}
          value={String(f.teamsLink || "")}
          onChangeText={(v) => set("teamsLink", v)}
        />
      </Card>
      {!form.isDirty&&!pending&&<Text>Make a change to enable Save changes.</Text>}<AppButton label="Save changes" loading={pending} disabled={!form.canSubmit} onPress={save} />
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
  },
  duration: { color: colors.primary, fontWeight: "700" },
  times: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
  timeField: { flexGrow: 1, flexBasis: 220 },
});
