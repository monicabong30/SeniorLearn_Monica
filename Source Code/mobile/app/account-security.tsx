import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { AppButton, Card, Field } from "../src/components/ui";
import { ScaledText as Text } from "../src/components/ScaledText";
import { useAuth } from "../src/context/Auth";
import { useFeedback } from "../src/context/Feedback";
import { api, errorMessage } from "../src/lib/api";
import { colors, space } from "../src/theme/tokens";
export default function AccountSecurity() {
  const { refreshUser } = useAuth(),
    { show } = useFeedback(),
    [email, setEmail] = useState(""),
    [emailPassword, setEmailPassword] = useState(""),
    [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState("");
  const changeEmail = async () => {
    if (busy || !/^\S+@\S+\.\S+$/.test(email) || !emailPassword) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      show("ERROR", "Enter a valid email address.");
      return;
    }
    try {
      setBusy("email");
      await api.put("/me/email", { email, currentPassword: emailPassword });
      await refreshUser();
      setEmailPassword("");
      show("SUCCESS", "Your email address has been updated.");
    } catch (e) {
      show("ERROR", errorMessage(e));
    } finally {
      setBusy("");
    }
  };
  const changePassword = async () => {
    if (busy || !current || next.length < 8 || next !== confirm) return;
    if (next.length < 8) {
      show("ERROR", "Your new password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      show("ERROR", "New password and confirmation do not match.");
      return;
    }
    try {
      setBusy("password");
      await api.put("/me/password", {
        currentPassword: current,
        newPassword: next,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      show("SUCCESS", "Your password has been updated.");
    } catch (e) {
      show("ERROR", errorMessage(e));
    } finally {
      setBusy("");
    }
  };
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.intro}>Use your current password to make security changes.</Text>
      <Card>
        <Field
          label="New email address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="Current password"
          value={emailPassword}
          onChangeText={setEmailPassword}
          secureTextEntry
        />
        <AppButton
          label="Change email address"
          onPress={changeEmail}
          loading={busy === "email"}
          disabled={!!busy || !/^\S+@\S+\.\S+$/.test(email) || !emailPassword}
        />
      </Card>
      <Card>
        <Field
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
        />
        <Field
          label="New password"
          value={next}
          onChangeText={setNext}
          secureTextEntry
        />
        <Field
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        <AppButton
          label="Change password"
          onPress={changePassword}
          loading={busy === "password"}
          disabled={!!busy || !current || next.length < 8 || next !== confirm}
        />
      </Card>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: space.lg,
    gap: space.lg,
    backgroundColor: colors.background,
  },
  intro: { color: colors.textSecondary },
});
