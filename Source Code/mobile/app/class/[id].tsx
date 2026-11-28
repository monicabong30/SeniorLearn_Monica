import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { FavouriteButton } from "../../src/components/FavouriteButton";
import {
  AppButton,
  Card,
  PageTitle,
  StatusBadge,
} from "../../src/components/ui";
import { useFeedback } from "../../src/context/Feedback";
import { api, errorMessage } from "../../src/lib/api";
import {
  cancellationFeedbackMessage,
  enrollmentFeedbackMessage,
} from "../../src/lib/feedbackMessages";
import {
  enrollmentLabel,
  enrollmentState,
} from "../../src/lib/enrollmentStatus";
import { colors, space, type } from "../../src/theme/tokens";
import { ConfirmationDialog } from "../../src/components/ConfirmationDialog";
import { isTeamsMeetingUrl } from "../../src/lib/teams";
import { useAuth } from "../../src/context/Auth";
import { canAdmin, canTutor } from "../../src/lib/permissions";
export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(), router = useRouter(), { effectiveStatus, membership, user, refreshUser } = useAuth(),
    [item, setItem] = useState<any>(),
    [rows, setRows] = useState<any[]>([]),
    [pending, setPending] = useState(false),
    [confirmCancel, setConfirmCancel] = useState(false),
    [refreshing, setRefreshing] = useState(false),
    { show } = useFeedback();
  const load = async () => {
    try {
      const detail = await api.get(`/classes/${id}`);
      const enrolments = await api.get("/enrollments").catch(() => null);
      setItem(detail.data.class);
      // Members with a pending or expired membership can view class details,
      // but the server correctly withholds their enrolment history.
      setRows(enrolments?.data ?? []);
    } catch (error) {
      Alert.alert("Unable to load class", errorMessage(error));
    }
  };
  const refresh = async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } };
  const openTeamsLink = async () => {
    const url = item?.teamsLink;
    if (!isTeamsMeetingUrl(url)) {
      Alert.alert("Invalid meeting link", "This class does not have a valid Microsoft Teams meeting link.");
      return;
    }
    try { if (!(await Linking.canOpenURL(url))) throw new Error("Unsupported URL"); await Linking.openURL(url); }
    catch { Alert.alert("Unable to open Teams", "Please check that Microsoft Teams or a web browser is available, then try again."); }
  };
  useFocusEffect(
    useCallback(() => {
      void (async () => { await refreshUser().catch(() => undefined); await load(); })();
    }, [id, refreshUser]),
  );
  const enrol = async () => {
    try {
      setPending(true);
      await api.post(`/classes/${id}/enrollments`);
      await load();
      show("SUCCESS", "You have successfully enrolled in this class.");
    } catch (error) {
      show("ERROR", enrollmentFeedbackMessage(error));
    } finally {
      setPending(false);
    }
  };
  const cancel = async () => {
    try {
      setPending(true);
      await api.delete(`/enrollments/${id}`);
      await load();
      show("SUCCESS", "Your enrollment has been cancelled successfully.");
    } catch (error) {
      show("ERROR", cancellationFeedbackMessage(error));
    } finally {
      setPending(false);
    }
  };
  const activeMembership = ["ACTIVE", "LIFETIME", "ADMIN"].includes(effectiveStatus ?? membership?.status ?? "");
  if (!item)
    return (
      <View style={s.loading}>
        <Text>Loading class…</Text>
      </View>
    );
  const state = enrollmentState(item, rows);
  const lifetimeMembership = ["LIFETIME", "ADMIN"].includes(effectiveStatus ?? "");
  const expiry = membership?.expiresAt ? new Date(membership.expiresAt) : undefined;
  const membershipCoversClass = activeMembership && (lifetimeMembership || (!!expiry && new Date(item.startsAt) <= new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate(), 23, 59, 59, 999)));
  const renewalRequired = activeMembership && !membershipCoversClass;
  const isTutor = canAdmin(user) || (canTutor(user) && String(item.tutor?._id || item.tutor?.id || item.tutor) === user?.id);
  return (
    <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      <View style={s.favourite}>
        <FavouriteButton classId={item._id} />
      </View>
      <PageTitle
        title={item.title}
        subtitle={new Date(item.startsAt).toLocaleString()}
      />
      <Card>
        <StatusBadge status={enrollmentLabel(state)} />
        <Text style={s.body}>{item.description}</Text>
        <Text>Duration: {item.durationMinutes} minutes</Text>
        <Text>Capacity: {item.capacity}</Text>
        <Text>Presented by {item.tutor?.name || "SeniorLearn tutor"}</Text>
        {item.delivery === "ONLINE" ? <><Text>Online via Microsoft Teams</Text>{activeMembership && item.teamsLink ? <Pressable accessibilityRole="link" accessibilityLabel="Open Microsoft Teams meeting" onPress={() => void openTeamsLink()}><Text style={s.teamsLink}>Open Microsoft Teams meeting</Text></Pressable> : <Text style={s.body}>{activeMembership ? "Enrol in this class to access the meeting link." : "Activate membership to access the meeting link."}</Text>}</> : <Text>{`Address: ${item.address}`}</Text>}
        {item.prerequisites && <Text>Prerequisites: {item.prerequisites}</Text>}
      </Card>
      {isTutor && <><AppButton label="Manage class" variant="outline" onPress={() => router.push({ pathname:"/tutor/edit", params:{ id:item._id, ...(item.recurrenceSeriesId ? { seriesId:item.recurrenceSeriesId } : {}) } })}/><AppButton label="Enrollment roster" variant="outline" onPress={() => router.push({ pathname:"/tutor/roster", params:{ id:item._id } })}/></>}
      {!isTutor && <>{renewalRequired && <Card><Text style={s.renewalTitle}>Membership renewal required</Text><Text style={s.body}>Your membership expires on {expiry?.toLocaleDateString("en-AU")}. This class takes place after your membership expires.</Text></Card>}
      {state === "ENROLLED" ? (
        <AppButton
          label="Cancel enrolment"
          variant="outline"
          loading={pending}
          onPress={() => setConfirmCancel(true)}
        />
      ) : !activeMembership ? (
        <AppButton label={effectiveStatus === "EXPIRED" ? "Renew membership to enrol" : "Activate membership to enrol"} onPress={() => router.push({ pathname:"/membership", params:{ returnTo:`/class/${id}` } })} />
      ) : renewalRequired ? (
        <AppButton label="Renew membership to enrol" onPress={() => router.push({ pathname:"/membership", params:{ returnTo:`/class/${id}` } })} />
      ) : (
        <AppButton
          label="Enrol now"
          loading={pending}
          disabled={state !== "AVAILABLE"}
          onPress={enrol}
        />
      )}</>}
      <ConfirmationDialog visible={confirmCancel} title="Cancel Enrollment?" message="Are you sure you want to cancel your enrollment in this class?" safeLabel="Keep Enrollment" destructiveLabel="Cancel Enrollment" loading={pending} onDismiss={() => setConfirmCancel(false)} onConfirm={async () => { await cancel(); setConfirmCancel(false); }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    padding: space.lg,
    gap: space.lg,
    backgroundColor: colors.background,
  },
  favourite: { alignItems: "flex-end", height: 0, zIndex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { ...type.body, color: colors.text },
  renewalTitle: { ...type.body, color: colors.error, fontWeight: "700" },
  teamsLink: { ...type.body, color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
});
