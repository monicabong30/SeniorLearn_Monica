import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { colors, space } from "../theme/tokens";

type Fallback = string | ((params: Record<string, string | string[] | undefined>) => any);

/** Shared secondary-screen back control. The stack owns the title so it can
 * truncate correctly alongside optional header actions. */
export function PageHeaderBack({ fallback, label = "Back" }: { fallback: Fallback; label?: string }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const goBack = () => {
    if (router.canGoBack()) return router.back();
    router.replace(typeof fallback === "function" ? fallback(params) : fallback as any);
  };
  return <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={goBack} style={({ pressed }) => [s.button, pressed && s.pressed]}>
    <Ionicons name="chevron-back" size={26} color={colors.primary} />
  </Pressable>;
}

export const pageHeaderStyle = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.primary, fontWeight: "700" as const, fontSize: 20 },
  headerTitleAlign: "left" as const,
  headerShadowVisible: false,
  headerLeftContainerStyle: { paddingLeft: space.sm },
  headerTitleContainerStyle: { paddingHorizontal: space.xs },
};

const s = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  pressed: { opacity: 0.65, backgroundColor: colors.background },
});
