import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "../../src/context/Auth";
import { canAdmin } from '../../src/lib/permissions';
import { useFeedback } from "../../src/context/Feedback";
import { api, errorMessage } from "../../src/lib/api";
import { AppButton, PageTitle } from "../../src/components/ui";
import { ClassForm } from "../../src/components/ClassForm";
import { AdminBackButton } from "../../src/components/AdminBackButton";
import { ConfirmationDialog } from "../../src/components/ConfirmationDialog";
import { KeyboardAwareScrollView } from "../../src/components/KeyboardAwareScrollView";
import { colors, space } from "../../src/theme/tokens";
import { useFormSubmitState } from "../../src/hooks/useFormSubmitState";
import { useUnsavedChangesGuard } from "../../src/hooks/useUnsavedChangesGuard";
import {
  durationBetween,
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
  const { id, from, seriesId } = useLocalSearchParams<{ id: string; from?: string; seriesId?: string }>(),
    router = useRouter(),
    { user } = useAuth(),
    { show } = useFeedback(),
    [f, setF] = useState<any>(),
    [initial, setInitial] = useState<any>(),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [pending, setPending] = useState(false),
    [scopeOpen, setScopeOpen] = useState(false),
    [scope, setScope] = useState<"SINGLE" | "FUTURE" | "ALL">("SINGLE"),
    [cancelScopeOpen, setCancelScopeOpen] = useState(false),
    [cancelOpen, setCancelOpen] = useState(false);
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
  const emptyForm={title:"",description:"",date:"",startTime:"",endTime:"",capacity:"",delivery:"ONLINE" as const,teamsLink:"",address:""};
  const validate=useCallback((values:any)=>validateClassForm(values),[]);
  const form=useFormSubmitState({initialValues:initial||f||emptyForm,values:f||emptyForm,validate,isSubmitting:pending,mode:"edit",normalize:(v:any)=>({title:v.title.trim(),description:v.description.trim(),date:v.date,startTime:v.startTime,endTime:v.endTime,capacity:String(v.capacity).trim(),delivery:v.delivery||"ONLINE",teamsLink:String(v.teamsLink||"").trim(),address:String(v.address||"").trim()})});
  const navigationGuard=useUnsavedChangesGuard(form.isDirty,pending);
  if (!f)
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
        <Text>Loading class…</Text>
      </View>
    );
  const set = (k: any, v: string) => {
    setF((current:any)=>({ ...current, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      if (k === "startTime" || k === "endTime") delete n.endTime;
      if (k === "delivery") { delete n.teamsLink; delete n.address; }
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
      if (f.recurrenceSeriesId) await api.put(`/recurrences/${f.recurrenceSeriesId}/${id}`, { ...patch, scope });
      else await api.put(`/classes/${id}`, patch);
      setInitial(f);
      show("SUCCESS", "Class updated successfully.");
      if (seriesId) router.replace({ pathname: "/tutor/recurring/[seriesId]", params: { seriesId } });
      else if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/tutor");
    } catch (error) {
      show("ERROR", errorMessage(error));
    } finally {
      setPending(false);
    }
  };
  const cancel = async () => {
    try { setPending(true); await api.post(`/recurrences/${f.recurrenceSeriesId}/${id}/cancel`, { scope }); show("SUCCESS", "Classes cancelled successfully."); setCancelOpen(false); if (seriesId) router.replace({ pathname: "/tutor/recurring/[seriesId]", params: { seriesId } }); else router.back(); }
    catch (error) { show("ERROR", errorMessage(error)); } finally { setPending(false); }
  };
  return (
    <KeyboardAwareScrollView contentContainerStyle={s.page}>
      {from === "admin" ? <Stack.Screen options={{
        headerTitle: () => null,
        headerLeft: () => <AdminBackButton label="Back" fallback={() => ({ pathname: "/admin/class", params: { id } })} />,
      }} /> : null}
      <PageTitle title="Edit class" />
      <ClassForm values={f} errors={errors} onChange={set}/>
      <AppButton label="Save changes" loading={pending} disabled={!form.canSubmit} onPress={() => f.recurrenceSeriesId ? setScopeOpen(true) : void save()} />
      {f.recurrenceSeriesId && !["CANCELLED", "COMPLETE"].includes(f.status) ? <AppButton label="Cancel class" variant="destructive" disabled={pending} onPress={() => setCancelScopeOpen(true)} /> : null}
      <AppButton label="Cancel" variant="outline" disabled={pending} onPress={()=>router.back()}/>
      <ScopeModal visible={scopeOpen} scope={scope} pending={pending} onScope={setScope} onDismiss={() => setScopeOpen(false)} onSave={() => { setScopeOpen(false); void save(); }} />
      <ScopeModal visible={cancelScopeOpen} title="Cancel classes in" actionLabel="Continue" scope={scope} pending={pending} onScope={setScope} onDismiss={() => setCancelScopeOpen(false)} onSave={() => { setCancelScopeOpen(false); setCancelOpen(true); }} />
      <ConfirmationDialog visible={cancelOpen} title={scope === "SINGLE" ? "Cancel class?" : "Cancel classes?"} message={`This will cancel ${scope === "SINGLE" ? "this class only" : scope === "FUTURE" ? "this class and future classes" : "all eligible classes in this series"}. Enrolled members will be notified.`} safeLabel="Keep classes" destructiveLabel={scope === "SINGLE" ? "Cancel Class" : "Cancel Classes"} loading={pending} onDismiss={() => setCancelOpen(false)} onConfirm={() => void cancel()} />
      <ConfirmationDialog visible={navigationGuard.discardConfirmationVisible} title="Discard changes?" message="Your unsaved changes will be lost." confirmLabel="Discard changes" cancelLabel="Keep editing" variant="destructive" onDismiss={navigationGuard.keepEditing} onConfirm={navigationGuard.discard}/>
    </KeyboardAwareScrollView>
  );
}
function ScopeModal({ visible, title = "Apply changes to", actionLabel = "Save Changes", scope, pending, onScope, onDismiss, onSave }: { visible: boolean; title?: string; actionLabel?: string; scope: "SINGLE" | "FUTURE" | "ALL"; pending: boolean; onScope: (scope: "SINGLE" | "FUTURE" | "ALL") => void; onDismiss: () => void; onSave: () => void }) {
  const options: ["SINGLE" | "FUTURE" | "ALL", string][] = [["SINGLE", "This class only"], ["FUTURE", "This and future classes"], ["ALL", "All classes in this series"]];
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}><View style={s.overlay}><View style={s.modal}><Text accessibilityRole="header" style={s.modalTitle}>{title}</Text>{options.map(([value, label]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: scope === value }} disabled={pending} onPress={() => onScope(value)} style={s.scope}><View style={[s.radio, scope === value && s.radioSelected]}>{scope === value ? <View style={s.dot} /> : null}</View><Text>{label}</Text></Pressable>)}<AppButton label={actionLabel} loading={pending} onPress={onSave}/><AppButton label="Cancel" variant="outline" disabled={pending} onPress={onDismiss}/></View></View></Modal>;
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
  overlay: { flex: 1, justifyContent: "center", padding: space.lg, backgroundColor: "rgba(0,0,0,.35)" },
  modal: { backgroundColor: colors.surface, borderRadius: 16, padding: space.lg, gap: space.md, maxWidth: 460, width: "100%", alignSelf: "center" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.primary },
  scope: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: space.sm },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textSecondary, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: colors.primary }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
