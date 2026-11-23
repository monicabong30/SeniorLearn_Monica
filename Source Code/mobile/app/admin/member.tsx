import { ScaledText as Text } from "../../src/components/ScaledText";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { api, errorMessage } from "../../src/lib/api";
import {
  AppButton,
  Card,
  StatusBadge,
} from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { rolesOf } from '../../src/lib/permissions';
export default function Member() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    [data, setData] = useState<any>(),
    [error, setError] = useState(""), router = useRouter();
  const load = () => {
    setError("");
    void api
      .get(`/admin/members/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(load, [id]);
  if (error)
    return (
      <View style={s.state}>
        <Text>{error}</Text>
        <AppButton label="Try again" onPress={load} />
      </View>
    );
  if (!data)
    return (
      <View style={s.state}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  const { user, membership } = data;
  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.memberHeader}>
        <Text accessibilityRole="header" numberOfLines={2} style={s.memberName}>
          {user.name || "Member"}
        </Text>
        <Text numberOfLines={2} style={s.memberEmail}>
          {user.email || "Email not available"}
        </Text>
      </View>
      <Card>
        <Text>Phone: {user.phone || "Not available"}</Text>
        {rolesOf(user).map(role=><StatusBadge key={role} status={role} />)}
        {user.isAdmin&&<StatusBadge status="ADMIN" />}
        <Text>Membership roles: {rolesOf(user).join(', ')}</Text>
        <Text>Membership status: {membership?.status || "Not available"}</Text>
        <Text>
          Expiry:{" "}
          {membership?.expiresAt
            ? new Date(membership.expiresAt).toLocaleDateString()
            : "Not available"}
        </Text>
      </Card>
      {user.isAdmin ? <Card><Text>This administrator account is read-only in member management.</Text></Card> : <AppButton label="Edit Member" onPress={() => router.push({ pathname: "/admin/edit-member", params: { id } })} />}
      <Card>
        <Text style={s.heading}>Payment records</Text>
        {data.payments?.length ? data.payments.map((payment: any) => <View key={payment._id} style={s.payment}><Text>{payment.kind.replace("_", " ")} · ${(payment.amountCents / 100).toFixed(2)}</Text><Text>{payment.status.replace("_", " ")} · {new Date(payment.createdAt).toLocaleDateString("en-AU")}</Text></View>) : <Text>No payment records available.</Text>}
      </Card>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    padding: space.lg,
    gap: space.lg,
    backgroundColor: colors.background,
  },
  state: {
    flex: 1,
    padding: space.xxl,
    justifyContent: "center",
    gap: space.lg,
  },
  heading: { fontSize: 20, fontWeight: "700", color: colors.primary },
  memberHeader: { gap: space.xs },
  memberName: { ...type.page, color: colors.text, fontWeight: "700" },
  memberEmail: { ...type.body, color: colors.textSecondary },
  payment: { gap: space.xs, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
