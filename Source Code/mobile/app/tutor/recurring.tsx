import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import {
  AppButton,
  Card,
  Field,
  PageTitle,
  StatusBadge,
} from "../../src/components/ui";
import { colors, space } from "../../src/theme/tokens";
import { ConfirmationDialog } from "../../src/components/ConfirmationDialog";
import { useFormSubmitState } from "../../src/hooks/useFormSubmitState";
export default function Recurring() {
  const { seriesId, occurrenceId } = useLocalSearchParams<{
      seriesId?: string;
      occurrenceId?: string;
    }>(),
    [rows, setRows] = useState<any[]>([]),
    [selectedId, setSelectedId] = useState<string | undefined>(occurrenceId),
    [scope, setScope] = useState<"SINGLE" | "FUTURE" | "ALL">("SINGLE"),
    [title, setTitle] = useState(""),
    [pending, setPending] = useState(false),
    [confirmCancel, setConfirmCancel] = useState(false),
    { show } = useFeedback();
  const load = async () => {
    try {
      const data = (
        await api.get("/classes", { params: { mine: "true" } })
      ).data.filter((x: any) => !seriesId || x.recurrenceSeriesId === seriesId);
      setRows(data);
      const target =
        data.find((x: any) => x._id === selectedId) ||
        data.find((x: any) => x._id === occurrenceId) ||
        data[0];
      setSelectedId(target?._id);
      setTitle(target?.title || "");
    } catch {
      show("ERROR", "Unable to load recurring classes.");
    }
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [seriesId, occurrenceId]),
  );
  const selected = rows.find((x) => x._id === selectedId);
  const form=useFormSubmitState({initialValues:{title:selected?.title||""},values:{title},validate:(v):Record<string,string>=>v.title.trim().length<3?{title:"Class title must be at least 3 characters."}:{},isSubmitting:pending,mode:"edit",normalize:v=>({title:v.title.trim()})});
  const act = async (cancel: boolean) => {
    if (!selected || (!cancel&&!form.canSubmit)) return;
    try {
      setPending(true);
      if (cancel)
        await api.post(
          `/recurrences/${selected.recurrenceSeriesId}/${selected._id}/cancel`,
          { scope },
        );
      else
        await api.put(
          `/recurrences/${selected.recurrenceSeriesId}/${selected._id}`,
          { scope, title: title || selected.title },
        );
      await load();
      show(
        "SUCCESS",
        cancel
          ? "Selected occurrences cancelled successfully."
          : "Selected occurrences updated successfully.",
      );
    } catch {
      show(
        "ERROR",
        cancel
          ? "Unable to cancel selected occurrences."
          : "Unable to update selected occurrences.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={s.page}>
      <PageTitle
        title="Manage recurring classes"
        subtitle="Select an occurrence, then choose how widely changes apply."
      />
      {rows.map((x) => (
        <Card key={x._id}>
          <Text style={s.title}>{x.title}</Text>
          <Text>{new Date(x.startsAt).toLocaleDateString()}</Text>
          <StatusBadge
            status={x._id === selectedId ? "Selected" : "Choose occurrence"}
          />
          <AppButton
            label={
              x._id === selectedId ? "Selected occurrence" : "Select occurrence"
            }
            variant="outline"
            onPress={() => {
              setSelectedId(x._id);
              setTitle(x.title);
            }}
          />
        </Card>
      ))}
      {selected && (
        <Card>
          <Text style={s.title}>Apply changes</Text>
          <Field label="Class title" value={title} onChangeText={setTitle} />
          {!form.isValid&&<Text style={{color:colors.error}}>{form.errors.title}</Text>}
          <Text>Scope: {scope.toLowerCase()}</Text>
          {(["SINGLE", "FUTURE", "ALL"] as const).map((x) => (
            <AppButton
              key={x}
              label={
                x === "SINGLE"
                  ? "This class only"
                  : x === "FUTURE"
                    ? "This and future classes"
                    : "All classes in series"
              }
              variant={scope === x ? "primary" : "outline"}
              disabled={pending}
              onPress={() => setScope(x)}
            />
          ))}
          <AppButton
            label="Update selected scope"
            loading={pending}
            disabled={!form.canSubmit}
            onPress={() => act(false)}
          />
          <AppButton
            label="Cancel selected scope"
            variant="destructive"
            loading={pending}
            onPress={() => setConfirmCancel(true)}
          />
        </Card>
      )}
      <ConfirmationDialog visible={confirmCancel} title="Cancel recurring classes?" message={`This will cancel ${scope === "SINGLE" ? "this class only" : scope === "FUTURE" ? "this class and future classes" : "all classes in this series"}.`} safeLabel="Keep Classes" destructiveLabel="Cancel Classes" loading={pending} onDismiss={() => setConfirmCancel(false)} onConfirm={async () => { await act(true); setConfirmCancel(false); }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    padding: space.lg,
    gap: space.md,
    backgroundColor: colors.background,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.primary },
});
