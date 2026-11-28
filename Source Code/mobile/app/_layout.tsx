import { Redirect, Stack, usePathname, useSegments } from "expo-router";
import { AuthProvider } from "../src/context/Auth";
import { PreferencesProvider } from "../src/context/Preferences";
import { FeedbackProvider } from "../src/context/Feedback";
import { useAuth } from "../src/context/Auth";
import { canAdmin, canTutor } from "../src/lib/permissions";
import { AdminBackButton } from "../src/components/AdminBackButton";
import { AdminBottomNavigation } from "../src/components/BottomTabBar";
import { MembershipBackButton } from "../src/components/MembershipBackButton";
import { appHeaderOptions } from "../src/components/AppHeader";
import { LoadingIndicator } from "../src/components/LoadingIndicator";
import { PageHeaderBack, pageHeaderStyle } from "../src/components/PageHeader";

const secondaryHeader = (title: string, fallback: string) => ({
  ...pageHeaderStyle,
  title,
  headerLeft: () => <PageHeaderBack fallback={fallback} />,
});

function Guard({ children }: { children: React.ReactNode }) {
  const { user, ready, effectiveStatus } = useAuth(), segments = useSegments(), pathname = usePathname();
  if (!ready)
    return (
      <LoadingIndicator variant="fill" accessibilityLabel="Checking your account" />
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
  // Pending and expired members may still browse, manage their account, and
  // activate/renew membership. The API remains the authority for enrolment.
  const recoveryRoute = pathname === '/membership' || pathname.startsWith('/payment/') || pathname === '/membership-expired' || pathname === '/payment-success' || pathname === '/payment-cancelled' || pathname === '/personal-information' || pathname === '/account-security' || pathname === '/settings' || pathname === '/help' || top === 'class' || top === '(tabs)';
  if (!canAdmin(user) && ['EXPIRED','PENDING','SUSPENDED','MISSING','INVALID'].includes(effectiveStatus||'') && !recoveryRoute) return <Redirect href="/membership" />;
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
              <Stack.Screen name="class/[id]" options={secondaryHeader("Class details", "/(tabs)")} />
              <Stack.Screen name="recurring/[seriesId]" options={{ ...secondaryHeader("", "/(tabs)/tutor"), headerTitle: () => null }} />
              <Stack.Screen name="bulletin/[id]" options={secondaryHeader("Bulletin details", "/(tabs)/bulletins")} />
              <Stack.Screen name="notification/[id]" options={secondaryHeader("Alert details", "/(tabs)/notifications")} />
              <Stack.Screen name="history/[id]" options={{ headerTitle: () => null }} />
              <Stack.Screen
                name="tutor/create"
                options={secondaryHeader("Create class", "/(tabs)/tutor")}
              />
              <Stack.Screen
                name="tutor/edit"
                options={{ headerTitle: () => null }}
              />
              <Stack.Screen
                name="tutor/recurring"
                options={{ headerTitle: () => null }}
              />
              <Stack.Screen name="tutor/recurring/[seriesId]" options={secondaryHeader("Recurring classes", "/(tabs)/tutor")} />
              <Stack.Screen
                name="tutor/recurring-create"
                options={secondaryHeader("Create recurring classes", "/(tabs)/tutor")}
              />
              <Stack.Screen
                name="tutor/roster"
                options={secondaryHeader("Enrollment roster", "/(tabs)/tutor")}
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
              <Stack.Screen name="admin/members" options={{ ...appHeaderOptions, headerBackVisible: false, headerLeft: () => null }} />
              <Stack.Screen name="admin/classes" options={{ ...appHeaderOptions, headerBackVisible: false, headerLeft: () => null }} />
              <Stack.Screen name="admin/class" options={{ headerTitle: () => null, headerLeft: () => <AdminBackButton label="Manage Classes" fallback="/admin/classes" /> }} />
              <Stack.Screen name="admin/edit-member" options={{ headerTitle: () => null, headerLeft: () => <AdminBackButton label="Member Details" fallback={(params) => ({ pathname: "/admin/member", params: { id: params.id } })} /> }} />
              <Stack.Screen name="admin/bulletins" options={{ ...appHeaderOptions, headerBackVisible: false, headerLeft: () => null }} />
              <Stack.Screen name="admin/create-bulletin" options={secondaryHeader("Create bulletin", "/admin/bulletins")} />
              <Stack.Screen name="settings" options={secondaryHeader("Settings", "/(tabs)/profile")} />
              <Stack.Screen
                name="personal-information"
                options={secondaryHeader("Personal information", "/(tabs)/profile")}
              />
              <Stack.Screen
                name="account-security"
                options={secondaryHeader("Account security", "/(tabs)/profile")}
              />
              <Stack.Screen name="membership" options={{ title: "Membership", headerLeft: () => <MembershipBackButton /> }} />
              <Stack.Screen name="payment/[id]" options={{ headerTitle: () => null }} />
              <Stack.Screen name="payment-success" options={{ title: "Payment status", headerBackVisible: false }} />
              <Stack.Screen name="payment-cancelled" options={{ title: "Payment status", headerBackVisible: false }} />
              <Stack.Screen name="membership-expired" options={{ title: "Membership", headerLeft: () => <MembershipBackButton /> }} />
            </Stack>
          </Guard>
        </FeedbackProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
