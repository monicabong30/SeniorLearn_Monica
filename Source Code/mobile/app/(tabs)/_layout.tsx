import { Ionicons } from "@expo/vector-icons";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomTabBar } from "../../src/components/BottomTabBar";
import { useAuth } from "../../src/context/Auth";
import { canAdmin } from "../../src/lib/permissions";
import { appRoutes } from "../../src/lib/navigation";
import { colors } from "../../src/theme/tokens";
import { api } from "../../src/lib/api";

function HeaderActions() {
  const router = useRouter();
  const [counts, setCounts] = useState({ bulletins: 0, alerts: 0 });
  useFocusEffect(
    useCallback(() => {
      void Promise.all([api.get("/bulletins"), api.get("/notifications")])
        .then(([bulletins, alerts]) =>
          setCounts({
            bulletins: bulletins.data.filter((item: any) => !item.readAt)
              .length,
            alerts: alerts.data.filter((item: any) => !item.readAt).length,
          }),
        )
        .catch(() => undefined);
    }, []),
  );
  return (
    <View style={s.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bulletins"
        onPress={() => router.push(appRoutes.bulletins)}
        style={s.head}
      >
        <Ionicons name="newspaper-outline" size={23} color={colors.primary} />
        {counts.bulletins > 0 && (
          <View
            accessibilityLabel={`${counts.bulletins} unread bulletins`}
            style={s.badge}
          />
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Alerts"
        onPress={() => router.push(appRoutes.notifications)}
        style={s.head}
      >
        <Ionicons
          name="notifications-outline"
          size={23}
          color={colors.primary}
        />
        {counts.alerts > 0 && (
          <View
            accessibilityLabel={`${counts.alerts} unread alerts`}
            style={s.badge}
          />
        )}
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitle: "SeniorLearn",
        headerTitleStyle: {
          color: colors.primary,
          fontSize: 24,
          fontWeight: "700",
        },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
      }}
    >
      <Tabs.Screen name="enrolments" options={{ title: "My Learning" }} />
      <Tabs.Screen name="tutor" options={{ title: "Tutor" }} />
      <Tabs.Screen name="favourites" options={{ title: "Favourites" }} />
      <Tabs.Screen name="index" options={{ title: "Classes" }} />
      <Tabs.Screen name="help" options={{ title: "Help" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="bulletins" options={{ title: "Bulletins" }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
      <Tabs.Screen
        name="admin"
        options={{
          href: canAdmin(user) ? undefined : null,
          title: "Admin",
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: "row", marginRight: 8 },
  head: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.surface,
  },
});
