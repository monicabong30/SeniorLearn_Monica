import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/context/Auth";
import { canAdmin } from "../src/lib/permissions";
export default function Index() {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  return <Redirect href={user ? (canAdmin(user) ? "/(tabs)/admin" : "/(tabs)") : "/(auth)/login"} />;
}
