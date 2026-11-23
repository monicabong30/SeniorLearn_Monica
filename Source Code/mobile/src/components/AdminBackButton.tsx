import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, space } from "../theme/tokens";
import { ScaledText as Text } from "./ScaledText";

type Props = {
  label: string;
  fallback: string | ((params: Record<string, string | string[] | undefined>) => any);
};

/** Shared, safe navigation control for stack-based administration screens. */
export function AdminBackButton({ label, fallback }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(typeof fallback === "function" ? fallback(params) : fallback as any);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      hitSlop={4}
      onPress={goBack}
      style={({ pressed }) => [s.button, pressed && s.pressed]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.primary} />
      <Text numberOfLines={1} style={s.label}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: { minHeight: 44, maxWidth: 210, flexDirection: "row", alignItems: "center", paddingHorizontal: space.sm },
  label: { color: colors.primary, fontSize: 16, fontWeight: "700", marginLeft: 1 },
  pressed: { opacity: 0.7 },
});
