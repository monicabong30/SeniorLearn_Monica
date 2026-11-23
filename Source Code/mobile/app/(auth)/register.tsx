import { ScaledText as Text } from "../../src/components/ScaledText";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import { registrationFeedbackMessage } from "../../src/lib/feedbackMessages";
import {
  emailError,
  passwordError,
} from "../../src/lib/registration";
import { AppButton, Field, PageTitle } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
export default function Register() {
  const [form, setForm] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    }),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(false),
    router = useRouter(),
    { show } = useFeedback();
  const set = (k: string, v: string) => {
      setForm((f) => ({ ...f, [k]: v }));
      setErrors((e) => ({ ...e, [k]: "" }));
    },
    validate = () => {
      const e: Record<string, string> = {};
      if (form.name.trim().length < 2) e.name = "Please enter your full name.";
      const email = emailError(form.email);
      if (email) e.email = email;
      if (form.phone.trim().length < 6)
        e.phone = "Please enter a valid phone number.";
      const password = passwordError(form.password);
      if (password) e.password = password;
      if (form.password !== form.confirmPassword)
        e.confirmPassword = "Passwords do not match.";
      setErrors(e);
      return !Object.keys(e).length;
    };
  const submit = async () => {
    if (loading || !validate()) return;
    try {
      setLoading(true);
      const { confirmPassword, ...body } = form;
      const { data } = await api.post("/auth/register", {
        ...body,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        communicationsOptIn: true,
      });
      if (!data?.user) throw Error();
      // Registration may return a token for API compatibility, but it must not
      // establish a session. The member signs in explicitly from Login.
      router.replace({
        pathname: "/(auth)/login",
        params: { registered: "1", email: body.email.trim().toLowerCase() },
      });
    } catch (e) {
      show("ERROR", registrationFeedbackMessage(e));
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.box}
      >
        <PageTitle
          title="Become a member"
          subtitle="Annual standard membership is $50 (simulated local payment)."
        />
        <Field
          label="Full name"
          autoComplete="name"
          value={form.name}
          error={errors.name}
          onBlur={validate}
          onChangeText={(v) => set("name", v)}
        />
        <Field
          label="Email address"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={form.email}
          error={errors.email}
          onBlur={validate}
          onChangeText={(v) => set("email", v)}
        />
        <Field
          label="Phone number"
          autoComplete="tel"
          keyboardType="phone-pad"
          value={form.phone}
          error={errors.phone}
          onBlur={validate}
          onChangeText={(v) => set("phone", v)}
        />
        <Field
          label="Password"
          secureTextEntry
          autoComplete="new-password"
          value={form.password}
          error={errors.password}
          onBlur={validate}
          onChangeText={(v) => set("password", v)}
        />
        <Text style={s.requirement}>
          Password requirement: at least 8 characters.
        </Text>
        <Field
          label="Confirm password"
          secureTextEntry
          autoComplete="new-password"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onBlur={validate}
          onChangeText={(v) => set("confirmPassword", v)}
        />
        <AppButton
          label="Register"
          loading={loading}
          onPress={submit}
        />
        <Pressable accessibilityRole="link" onPress={() => router.push("/(auth)/login")}>
          <Text style={s.link}>Already have an account? Sign In</Text>
        </Pressable>
        <Text style={s.note}>
          Your details are used only to manage your SeniorLearn membership. The
          $50 membership payment is simulated for this assessment; no real
          payment is taken.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  box: {
    padding: space.xxl,
    gap: space.lg,
    flexGrow: 1,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  requirement: {
    ...type.secondary,
    color: colors.textSecondary,
    marginTop: -space.sm,
  },
  link: {
    ...type.body,
    color: colors.primary,
    textAlign: "center",
    fontWeight: "700",
  },
  note: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
});
