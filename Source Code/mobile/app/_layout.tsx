import { Redirect, Stack, usePathname, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "../src/context/Auth";
import { PreferencesProvider } from "../src/context/Preferences";
import { FeedbackProvider } from "../src/context/Feedback";
import { useAuth } from "../src/context/Auth";
import { canAdmin, canTutor } from "../src/lib/permissions";
import { AdminBackButton } from "../src/components/AdminBackButton";
import { AdminBottomNavigation } from "../src/components/BottomTabBar";

function Guard({ children }: { children: React.ReactNode }) {
  const { user, ready, effectiveStatus } = useAuth(), segments = useSegments(), pathname = usePathname();
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  const top = segments[0],
    sub = (segments as string[])[1];
  if (!user)
    return top === "(auth)" ? (
      <>{children}</>
    ) : (
      <Redirect href="/(auth)/login" />
    );
  if (top === "(auth)") return <Redirect href={canAdmin(user) ? "/(tabs)/admin" : "/(tabs)"} />;
  const recoveryRoute = pathname === '/membership' || pathname === '/membership-expired' || pathname === '/personal-information' || pathname === '/account-security' || pathname === '/settings' || pathname === '/help';
  if (!canAdmin(user) && ['EXPIRED','PENDING','SUSPENDED','MISSING','INVALID'].includes(effectiveStatus||'') && !recoveryRoute) return <Redirect href="/membership-expired" />;
  if (
    (top === "tutor" || (top === "(tabs)" && sub === "tutor")) &&
    !canTutor(user)
  )
    return <Redirect href="/(tabs)" />;
  if (
    (top === "admin" || (top === "(tabs)" && sub === "admin")) &&
    !canAdmin(user)
  )
    return <Redirect href="/(tabs)" />;
  const mainAdminRoute = pathname === '/admin/members' || pathname === '/admin/classes' || pathname === '/admin/bulletins';
  return <>{children}{mainAdminRoute && canAdmin(user) && <AdminBottomNavigation />}</>;
}

export default function Root() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <FeedbackProvider>
          <Guard>
            <Stack
              screenOptions={{
                animation: "fade_from_bottom",
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#003366",
                headerTitleStyle: { color: "#003366", fontWeight: "700", fontSize: 24 },
                headerTitleAlign: "left",
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="(auth)/login"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(auth)/register"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="class/[id]"
                options={{ title: "Class Details" }}
              />
              <Stack.Screen name="bulletin/[id]" options={{ title: "Bulletin Details" }} />
              <Stack.Screen name="notification/[id]" options={{ title: "Alert Details" }} />
              <Stack.Screen name="history/[id]" options={{ title: "Learning History" }} />
              <Stack.Screen
                name="tutor/create"
                options={{ title: "Create Class" }}
              />
              <Stack.Screen
                name="tutor/edit"
                options={{ title: "Edit Class" }}
              />
              <Stack.Screen
                name="tutor/recurring"
                options={{ title: "Recurring Classes" }}
              />
              <Stack.Screen
                name="tutor/recurring-create"
                options={{ title: "Create Recurring Classes" }}
              />
              <Stack.Screen
                name="tutor/roster"
                options={{ title: "Enrollment Roster" }}
              />
              <Stack.Screen
                name="admin/member"
                options={{
                  headerTitle: () => null,
                  headerLeft: () => (
                    <AdminBackButton
                      label="Manage Members"
                      fallback="/admin/members"
                    />
                  ),
                }}
              />
              <Stack.Screen name="admin/members" options={{ title: "Manage Members", headerBackVisible: false }} />
              <Stack.Screen name="admin/classes" options={{ title: "Manage Classes", headerBackVisible: false }} />
              <Stack.Screen name="admin/class" options={{ headerTitle: () => null, headerLeft: () => <AdminBackButton label="Manage Classes" fallback="/admin/classes" /> }} />
              <Stack.Screen name="admin/edit-member" options={{ title: "Edit Member", headerLeft: () => <AdminBackButton label="Member Details" fallback={(params) => ({ pathname: "/admin/member", params: { id: params.id } })} /> }} />
              <Stack.Screen name="admin/bulletins" options={{ title: "Manage Bulletins", headerBackVisible: false }} />
              <Stack.Screen name="admin/create-bulletin" options={{ title: "Create Bulletin", headerLeft: () => <AdminBackButton label="Manage Bulletins" fallback="/admin/bulletins" /> }} />
              <Stack.Screen name="settings" options={{ title: "Settings" }} />
              <Stack.Screen
                name="personal-information"
                options={{ title: "Personal Information" }}
              />
              <Stack.Screen
                name="account-security"
                options={{ title: "Account Security" }}
              />
              <Stack.Screen name="membership" options={{ title: "Membership Renewal" }} />
              <Stack.Screen name="membership-expired" options={{ headerShown: false }} />
            </Stack>
          </Guard>
        </FeedbackProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
