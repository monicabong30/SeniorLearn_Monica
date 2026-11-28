import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow, space, type } from "../theme/tokens";
import { usePreferences } from "../context/Preferences";
import { ScaledText as Text } from "./ScaledText";
import { PasswordInput } from "./PasswordInput";
import { LoadingIndicator } from "./LoadingIndicator";
export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.screen, style]}>{children}</View>;
}
export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  // A fragment avoids a web renderer edge case where a scaled text component
  // inside a layout View was reported as a raw text child.
  return <>
    <Text accessibilityRole="header" style={[s.title, s.headingTitle]}>{title}</Text>
    {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
  </>;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function AppButton({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text" | "destructive";
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const x = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => x.remove();
  }, []);
  const inactive = !!disabled || !!loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        s[variant],
        inactive && s.disabled,
        pressed && !inactive && !reduced && s.pressed,
      ]}
    >
      {loading ? (
        <LoadingIndicator variant="inline" color={variant === "outline" || variant === "text" ? colors.primary : "#fff"} accessibilityLabel={`${label} in progress`} />
      ) : (
        <Text
          style={[s.buttonText, (variant === "outline" || variant === "text") && s.outlineText]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
export function Field(fieldProps: TextInputProps & { label: string; error?: string }) {
  // Fields never render children. Explicitly remove them before forwarding
  // input props so a stray JSX text node cannot reach a native View.
  const { label, error, style, secureTextEntry, children: _children, ...inputProps } = fieldProps;
  const placeholderExamples: Record<string, string> = {
    "class title": "e.g. Introduction to Digital Photography",
    "description": "e.g. Learn basic photography skills",
    "full name": "e.g. Jane Smith",
    "email address": "jane@example.com",
    "password": "Password",
    "confirm password": "Confirm password",
    "microsoft teams link": "https://teams.microsoft.com/...",
    "venue address": "e.g. 25 George Street",
    "bulletin title": "e.g. Upcoming Learning Workshop",
    "bulletin message": "e.g. Join us for our next workshop",
    "name on card": "e.g. Jane Smith",
    "cvv": "CVV",
  };
  const normalizedLabel = label.toLowerCase();
  const defaultPlaceholder = placeholderExamples[normalizedLabel]
    ?? (normalizedLabel.startsWith("search") ? `${label}...` : label);
  const sanitizedInputProps = { placeholder: defaultPlaceholder, ...inputProps } as TextInputProps & { children?: never };
  delete (sanitizedInputProps as { children?: unknown }).children;
  const password = !!secureTextEntry;
  const { fontScale } = usePreferences();
  return (
    <View style={s.field}>
      <NativeText style={s.label} children={label} />
      {password ? <PasswordInput
          containerStyle={s.inputWrap}
          accessibilityLabel={label}
          placeholderTextColor={colors.textSecondary}
          style={[
            s.input,
            { fontSize: 17 * fontScale, lineHeight: 25 * fontScale },
            error && s.inputError,
            style,
          ]}
          {...sanitizedInputProps}
        /> : <View style={s.inputWrap}><TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSecondary}
          style={[s.input, { fontSize: 17 * fontScale, lineHeight: 25 * fontScale }, error && s.inputError, style]}
          {...sanitizedInputProps}
        /></View>}
      {error && (
        <NativeText accessibilityRole="alert" style={s.error} children={error} />
      )}
    </View>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const n = status.toUpperCase(),
    tone = /CANCEL|EXPIRE|FULL/.test(n)
      ? "error"
      : n === "NEW"
        ? "success"
      : n === "READ"
        ? "neutral"
      : /DRAFT|UNREAD|SOON/.test(n)
        ? "warning"
        : /ACTIVE|AVAILABLE|PUBLISH|COMPLETE|ENROLL/.test(n)
          ? "success"
          : "info";
  return (
    <View
      accessibilityLabel={`Status: ${status}`}
      style={[s.badge, s[`badge${tone}` as const]]}
    >
      <Text style={[s.badgeText, s[`text${tone}` as const]]}>
        {status.replaceAll("_", " ")}
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, padding: space.lg, backgroundColor: colors.background },
  headingTitle: { marginBottom: space.xs },
  title: { ...type.page, color: colors.text },
  subtitle: { ...type.body, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.lg,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.separator,
    ...shadow,
  },
  button: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  destructive: { backgroundColor: colors.error },
  text: { backgroundColor: "transparent", alignSelf: "center", minHeight: 44 },
  disabled: { opacity: 0.52 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  buttonText: { ...type.body, fontWeight: "700", color: "#fff" },
  outlineText: { color: colors.primary },
  field: { gap: space.xs },
  label: { ...type.body, fontWeight: "600", color: colors.text },
  inputWrap: { position: "relative", justifyContent: "center" },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: space.md,
    ...type.body,
    color: colors.text,
  },
  passwordInput: { paddingRight: 56 },
  inputError: { borderColor: colors.error },
  visibility: {
    position: "absolute",
    right: 4,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  visibilityPressed: { backgroundColor: "#e8eff5" },
  error: { ...type.secondary, color: colors.error },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { ...type.caption, fontWeight: "700" },
  badgeerror: { backgroundColor: "#fde8e8" },
  badgewarning: { backgroundColor: "#fff4d6" },
  badgesuccess: { backgroundColor: "#dcf5e8" },
  badgeneutral: { backgroundColor: "#ECECEF" },
  badgeinfo: { backgroundColor: "#e0efff" },
  texterror: { color: colors.error },
  textwarning: { color: colors.warning },
  textsuccess: { color: colors.success },
  textneutral: { color: colors.textSecondary },
  textinfo: { color: colors.info },
});
