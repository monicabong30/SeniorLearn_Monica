import { Tabs } from "expo-router";
import { BottomTabBar } from "../../src/components/BottomTabBar";
import { useAuth } from "../../src/context/Auth";
import { canAdmin } from "../../src/lib/permissions";
import { appHeaderOptions } from "../../src/components/AppHeader";

export default function TabsLayout() {
  const { user } = useAuth();
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={appHeaderOptions}
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
