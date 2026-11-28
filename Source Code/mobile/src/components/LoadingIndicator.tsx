import { ActivityIndicator, StyleSheet, View, type ColorValue, type ViewStyle } from "react-native";
import { colors, space } from "../theme/tokens";

type Props = {
  /** Use `fill` for a page/content area and `inline` for cards and buttons. */
  variant?: "fill" | "section" | "inline";
  size?: "small" | "large";
  style?: ViewStyle;
  accessibilityLabel?: string;
  color?: ColorValue;
};

/** A consistent, accessible progress indicator for request-backed UI. */
export function LoadingIndicator({
  variant = "section",
  size = "large",
  style,
  accessibilityLabel = "Loading",
  color = colors.primary,
}: Props) {
  if (variant === "inline") {
    return <ActivityIndicator size="small" color={color} accessibilityLabel={accessibilityLabel} accessibilityRole="progressbar" />;
  }
  return (
    <View style={[variant === "fill" ? styles.fill : styles.section, style]} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.lg },
  section: { minHeight: 160, alignItems: "center", justifyContent: "center", padding: space.lg },
});
