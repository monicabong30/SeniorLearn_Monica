import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "../../src/context/Auth";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import {
  AppButton,
  Card,
  PageTitle,
  StatusBadge,
} from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { canAdmin, canTutor } from '../../src/lib/permissions';
const Row = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>
    <Text style={s.rowText}>{label}</Text>
    <Text style={s.arrow}>›</Text>
  </Pressable>
);
export default function Profile() {
  const { user, signOut } = useAuth(),
    router = useRouter(),
    { show } = useFeedback(),
    [membership, setMembership] = useState<any>(),
    [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { setRefreshing(true); const r=await api.get("/me"); setMembership(r.data.membership); } catch { show("ERROR", "Unable to load membership details."); } finally { setRefreshing(false); } }, [show]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return (
    <ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}>
      <PageTitle
        title="Your profile"
        subtitle="Your account and membership in one place."
      />
      <Card style={s.profileCard}>
        <Text style={s.name}>{user?.name}</Text>
        <Text>
          {canTutor(user) && !canAdmin(user)
            ? "Tutor membership"
            : canAdmin(user)
              ? "Administrator membership"
              : "Member membership"}
        </Text>
        {membership && (
          <>
            <StatusBadge status={membership.status} />
            <Text>
              Membership expiry:{" "}
              {new Date(membership.expiresAt).toLocaleDateString("en-AU")}
            </Text>
          </>
        )}
      </Card>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <Card style={s.settingsCard}>
        <Row
          label="Personal Information"
          onPress={() => router.push("/personal-information")}
        />
        <Row
          label="Account Security"
          onPress={() => router.push("/account-security")}
        />
        <Row label="Membership" onPress={() => router.push('/membership')} />
        <Row label="Settings" onPress={() => router.push("/settings")} />
        </Card>
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <Card style={s.settingsCard}>
        <Text>App Version {Constants.expoConfig?.version || "1.0.0"}</Text>
        </Card>
      </View>
      <AppButton
        label="Sign out"
        variant="destructive"
        onPress={() => void signOut()}
        accessibilityHint="Signs you out on this device"
      />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flexGrow: 1, width: "100%", maxWidth: 680, alignSelf: "center", padding: space.lg, gap: space.lg, backgroundColor: colors.background },
  profileCard: { gap: space.sm },
  section: { gap: space.sm },
  sectionTitle: { ...type.caption, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: .5, marginLeft: space.sm },
  settingsCard: { paddingVertical: 0, gap: 0 },
  name: { ...type.page, color: colors.text },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  rowText: { ...type.body, fontWeight: "600", color: colors.text },
  arrow: { fontSize: 28, color: colors.textSecondary },
});
