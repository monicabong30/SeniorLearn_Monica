import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import logo from "../../assets/images/SeniorLearn_logo.png";
import { api } from "../lib/api";
import { appRoutes } from "../lib/navigation";
import { useAuth } from "../context/Auth";
import { canAdmin } from "../lib/permissions";
import { colors } from "../theme/tokens";

/** The single branded header shared by top-level navigation destinations. */
export function AppHeaderBrand() {
  const router = useRouter();
  const { user } = useAuth();
  const destination = canAdmin(user) ? "/(tabs)/admin" : "/(tabs)";
  return <Pressable accessibilityRole="button" accessibilityLabel={canAdmin(user) ? "Go to Admin Dashboard" : "Go to Classes"} onPress={() => router.replace(destination)} style={s.brandTitle}>
    <Image source={logo} style={s.brandLogo} />
    <Text style={s.brandName}>SeniorLearn</Text>
  </Pressable>;
}

export function AppHeaderActions() {
  const router = useRouter();
  const [counts, setCounts] = useState({ bulletins: 0, alerts: 0 });
  useFocusEffect(useCallback(() => {
    void Promise.all([api.get("/bulletins"), api.get("/notifications")])
      .then(([bulletins, alerts]) => setCounts({ bulletins: bulletins.data.filter((item: any) => !item.readAt).length, alerts: alerts.data.filter((item: any) => !item.readAt).length }))
      .catch(() => undefined);
  }, []));
  return <View style={s.actions}>
    <Pressable accessibilityRole="button" accessibilityLabel="Bulletins" onPress={() => router.push(appRoutes.bulletins)} style={s.head}>
      <Ionicons name="newspaper-outline" size={23} color={colors.primary} />
      {counts.bulletins > 0 ? <View accessibilityLabel={`${counts.bulletins} unread bulletins`} style={s.badge} /> : null}
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Alerts" onPress={() => router.push(appRoutes.notifications)} style={s.head}>
      <Ionicons name="notifications-outline" size={23} color={colors.primary} />
      {counts.alerts > 0 ? <View accessibilityLabel={`${counts.alerts} unread alerts`} style={s.badge} /> : null}
    </Pressable>
  </View>;
}

export const appHeaderOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitle: () => <AppHeaderBrand />,
  headerTitleAlign: "left" as const,
  headerShadowVisible: false,
  headerRight: () => <AppHeaderActions />,
};

const s = StyleSheet.create({
  actions: { flexDirection: "row", marginRight: 8 }, brandTitle: { flexDirection: "row", alignItems: "center", gap: 9 }, brandLogo: { width: 30, height: 30, borderRadius: 7 }, brandName: { color: colors.primary, fontSize: 24, fontWeight: "700" },
  head: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 }, badge: { position: "absolute", top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.error, borderWidth: 1, borderColor: colors.surface },
});
