import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow, space, type } from "../theme/tokens";
import { usePreferences } from "../context/Preferences";
import { ScaledText as Text } from "./ScaledText";
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
  return (
    <View style={s.heading}>
      {/** The navigator owns the primary screen title.  Keeping PageTitle as
       * an intro container lets existing screens retain useful context without
       * rendering a second, competing page heading. */}
      {subtitle && (
        <Text
          style={s.subtitle}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
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
        <ActivityIndicator
          color={variant === "outline" || variant === "text" ? colors.primary : "#fff"}
        />
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
export function Field({
  label,
  error,
  style,
  secureTextEntry,
  children: _children,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const [visible, setVisible] = useState(false),
    password = !!secureTextEntry;
  const { fontScale } = usePreferences();
  return (
    <View style={s.field}>
      <Text
        style={s.label}
      >
        {label}
      </Text>
      <View style={s.inputWrap}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSecondary}
          style={[
            s.input,
            { fontSize: 17 * fontScale, lineHeight: 25 * fontScale },
            error && s.inputError,
            password && s.passwordInput,
            style,
          ]}
          secureTextEntry={password && !visible}
          {...props}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            accessibilityHint="Keeps the password you entered"
            hitSlop={8}
            onPress={() => setVisible((v) => !v)}
            style={({ pressed }) => [
              s.visibility,
              pressed && s.visibilityPressed,
            ]}
          >
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
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
  heading: { gap: space.xs, marginBottom: space.lg },
  title: { ...type.page, color: colors.text },
  subtitle: { ...type.body, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.lg,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderWidth: 1.5,
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
