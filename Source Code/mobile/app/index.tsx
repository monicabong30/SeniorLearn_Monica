import { Redirect } from "expo-router";
import { useAuth } from "../src/context/Auth";
import { canAdmin } from "../src/lib/permissions";
import { LoadingIndicator } from "../src/components/LoadingIndicator";
export default function Index() {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <LoadingIndicator variant="fill" accessibilityLabel="Restoring your session" />
    );
  return <Redirect href={user ? (canAdmin(user) ? "/(tabs)/admin" : "/(tabs)") : "/(auth)/login"} />;
}
