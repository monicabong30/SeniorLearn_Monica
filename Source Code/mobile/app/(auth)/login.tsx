import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useAuth } from "../../src/context/Auth";
import { useFeedback } from "../../src/context/Feedback";
import { api, loginErrorMessage } from "../../src/lib/api";
import { canAdmin } from "../../src/lib/permissions";
import { AppButton, Field } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { ScaledText as Text } from "../../src/components/ScaledText";
import logo from "../../assets/images/SeniorLearn_logo.png";
export default function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false),
    scroll = useRef<any>(null),
    { signIn } = useAuth(),
    router = useRouter(),
    params = useLocalSearchParams<{ registered?: string; email?: string }>(),
    { show } = useFeedback();
  const [registrationSuccess, setRegistrationSuccess] = useState(
    params.registered === "1",
  );
  useEffect(() => {
    if (params.registered !== "1") return;
    setRegistrationSuccess(true);
    if (typeof params.email === "string") setEmail(params.email);
  }, [params.email, params.registered]);
  const dismissRegistrationSuccess = () => {
    setRegistrationSuccess(false);
    router.setParams({ registered: undefined, email: undefined });
  };
  const submit = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      await signIn(data.token, data.user);
      show("SUCCESS", "Login successful.");
      // Use the server-refreshed account returned by signIn where possible, but
      // the login response is sufficient to select the first authenticated
      // screen.  This avoids a flash of the Classes tab for administrators.
      router.replace(canAdmin(data.user) ? "/(tabs)/admin" : "/(tabs)");
    } catch (e) {
      show("ERROR", loginErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scroll}
      >
        <View style={s.hero}>
          <View style={s.brandRow}>
            <Image source={logo} style={s.logo} />
            <Text style={s.brand}>SeniorLearn</Text>
          </View>
          <Text style={s.tagline}>Lifelong learning, made accessible.</Text>
        </View>
        <View style={s.form}>
          {registrationSuccess && (
            <View
              accessibilityRole="alert"
              accessibilityLabel="Registration successful. Your account has been created successfully. Please sign in to continue."
              style={s.registrationSuccess}
            >
              <View style={s.successCopy}>
                <Text style={s.successTitle}>Registration Successful!</Text>
                <Text style={s.successMessage}>
                  Your account has been created successfully. Please sign in to
                  continue.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss registration success message"
                onPress={dismissRegistrationSuccess}
                style={s.dismiss}
              >
                <Text style={s.dismissText}>Dismiss</Text>
              </Pressable>
            </View>
          )}
          <Text accessibilityRole="header" style={s.title}>
            Welcome back
          </Text>
          <Text style={s.lead}>Sign in to find your next class.</Text>
          <Field
            label="Email address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => scroll.current?.scrollToEnd({ animated: true })}
          />
          <Field
            label="Password"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            onFocus={() => scroll.current?.scrollToEnd({ animated: true })}
          />
          <AppButton label="Sign in" loading={loading} onPress={submit} />
          <Pressable accessibilityRole="link" onPress={() => router.push("/(auth)/register")}>
            <Text style={s.link}>New to SeniorLearn? Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: space.xxl,
    gap: space.hero,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  hero: { gap: space.sm },
  brandRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  logo: { width: 54, height: 54, borderRadius: 13 },
  brand: { ...type.display, color: colors.primary },
  tagline: { ...type.body, color: colors.textSecondary },
  form: {
    gap: space.lg,
    backgroundColor: colors.surface,
    padding: space.xxl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  registrationSuccess: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    padding: space.md,
    backgroundColor: "#dcf5e8",
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 12,
  },
  successCopy: { flex: 1, gap: space.xs },
  successTitle: { ...type.body, fontWeight: "700", color: colors.success },
  successMessage: { ...type.secondary, color: colors.text },
  dismiss: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.xs },
  dismissText: { ...type.secondary, color: colors.success, fontWeight: "700" },
  title: { ...type.page, color: colors.text },
  lead: { ...type.body, color: colors.textSecondary },
  link: {
    ...type.body,
    color: colors.primary,
    textAlign: "center",
    fontWeight: "600",
  },
});
