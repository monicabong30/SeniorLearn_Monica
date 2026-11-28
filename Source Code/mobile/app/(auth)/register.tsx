import { ScaledText as Text } from "../../src/components/ScaledText";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Checkbox } from "../../src/components/Checkbox";
import { DatePickerField } from "../../src/components/DatePickerField";
import { PhoneNumberField } from "../../src/components/PhoneNumberField";
import { PasswordInput } from "../../src/components/PasswordInput";
import { AppButton } from "../../src/components/ui";
import { useFeedback } from "../../src/context/Feedback";
import { useAuth } from "../../src/context/Auth";
import { api } from "../../src/lib/api";
import { registrationFeedbackMessage } from "../../src/lib/feedbackMessages";
import { emailError, localDateOnly, passwordError } from "../../src/lib/registration";
import { colors, space, type } from "../../src/theme/tokens";

type Form = { name: string; email: string; phone: string; password: string; confirmPassword: string; dateOfBirth: string; termsAccepted: boolean; communicationsOptIn: boolean };
const steps = ["Your details", "Account", "Membership"];
function RegisterInput({ error: _error, style, ...props }: TextInputProps & { error?: string }) {
  if (props.accessibilityLabel === "Phone number") return <PhoneNumberField value={String(props.value ?? "")} onChange={(value) => props.onChangeText?.(value)} error={_error} />;
  if (props.secureTextEntry) return <PasswordInput {...props} style={[s.input, style]} placeholderTextColor={colors.textSecondary} />;
  return <TextInput {...props} style={[s.input, style]} placeholderTextColor={colors.textSecondary} />;
}
export default function Register() {
  const [form, setForm] = useState<Form>({ name: "", email: "", phone: "", password: "", confirmPassword: "", dateOfBirth: "", termsAccepted: false, communicationsOptIn: false });
  const [errors, setErrors] = useState<Record<string, string>>({}), [step, setStep] = useState(0), [loading, setLoading] = useState(false);
  const router = useRouter(); const { show } = useFeedback(); const { signIn } = useAuth();
  const set = <K extends keyof Form>(key: K, value: Form[K]) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "", terms: key === "termsAccepted" ? "" : current.terms })); };
  const validateStep = (index: number) => {
    const next: Record<string, string> = {};
    if (index === 0) { if (form.name.trim().length < 2) next.name = "Enter your full name."; if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) next.dateOfBirth = "Choose your date of birth."; if (form.phone.replace(/\D/g, "").length < 8) next.phone = "Enter a valid phone number."; }
    if (index === 1) { const email = emailError(form.email); if (email) next.email = email; const password = passwordError(form.password); if (password) next.password = password; if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match."; }
    if (index === 2 && !form.termsAccepted) next.terms = "Accept the Terms and Conditions to continue.";
    setErrors(next); return !Object.keys(next).length;
  };
  const continueStep = () => { if (validateStep(step)) setStep((value) => Math.min(2, value + 1)); };
  const submit = async () => { if (loading || !validateStep(2)) return; try { setLoading(true); const { confirmPassword, ...body } = form; const { data } = await api.post("/auth/register", { ...body, name: body.name.trim(), email: body.email.trim().toLowerCase(), phone: body.phone.trim(), termsVersion: "2026-11" }); if (!data?.user || !data?.token) throw Error(); await signIn(data.token, data.user); show("SUCCESS", "Your account has been created."); router.replace("/(tabs)"); } catch (error) { show("ERROR", registrationFeedbackMessage(error)); } finally { setLoading(false); } };
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.box}>
    <Text accessibilityRole="header" style={s.pageTitle}>Join SeniorLearn</Text>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 3, now: step + 1 }} style={s.progress}>{steps.map((label, index) => <View key={label} style={s.progressItem}><View style={[s.dot, index <= step && s.dotActive]}><Text style={[s.dotText, index <= step && s.dotTextActive]}>{index + 1}</Text></View><Text style={[s.stepLabel, index === step && s.stepLabelActive]}>{label}</Text></View>)}</View>
    <View style={s.form}>{step === 0 && <><Text style={s.stepTitle}>A few details</Text><RegisterInput accessibilityLabel="Full name" placeholder="e.g. Jane Smith" autoComplete="name" value={form.name} onChangeText={(value) => set("name", value)} />{errors.name ? <Text style={s.error}>{errors.name}</Text> : null}<DatePickerField label="Date of birth" placeholder="DD/MM/YYYY" value={form.dateOfBirth} error={errors.dateOfBirth} maximumDate={localDateOnly()} onChange={(value) => set("dateOfBirth", value)} /><RegisterInput accessibilityLabel="Phone number" placeholder="e.g. 412 345 678" autoComplete="tel" keyboardType="phone-pad" value={form.phone} onChangeText={(value) => set("phone", value)} />{errors.phone ? <Text style={s.error}>{errors.phone}</Text> : null}</>}{step === 1 && <><Text style={s.stepTitle}>Set up your account</Text><RegisterInput accessibilityLabel="Email address" placeholder="jane@example.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={form.email} onChangeText={(value) => set("email", value)} />{errors.email ? <Text style={s.error}>{errors.email}</Text> : null}<RegisterInput accessibilityLabel="Password" placeholder="Password" secureTextEntry autoComplete="new-password" value={form.password} onChangeText={(value) => set("password", value)} />{(!!form.password || !!errors.password) && <Text style={s.hint}>At least 8 characters.</Text>}{errors.password ? <Text style={s.error}>{errors.password}</Text> : null}<RegisterInput accessibilityLabel="Confirm password" placeholder="Confirm password" secureTextEntry autoComplete="new-password" value={form.confirmPassword} onChangeText={(value) => set("confirmPassword", value)} />{errors.confirmPassword ? <Text style={s.error}>{errors.confirmPassword}</Text> : null}</>}{step === 2 && <><Text style={s.stepTitle}>Membership</Text><View style={s.price}><Text style={s.priceTitle}>Annual membership</Text><Text style={s.priceValue}>$50 AUD</Text></View><Text style={s.membershipNote}>Create your account now, then complete secure payment to activate membership.</Text><Checkbox checked={form.termsAccepted} label="I accept the SeniorLearn Terms and Conditions." error={errors.terms} onChange={(value) => set("termsAccepted", value)} /><Checkbox checked={form.communicationsOptIn} label="Send me news and reminders." onChange={(value) => set("communicationsOptIn", value)} /></>}</View>
    <View style={s.actions}>{step < 2 ? <AppButton label="Continue" onPress={continueStep} /> : <AppButton label="Create account" loading={loading} onPress={submit} />}{step > 0 && <AppButton label="Back" variant="outline" onPress={() => setStep((value) => value - 1)} />}</View>
    <Pressable accessibilityRole="link" onPress={() => router.push("/(auth)/login")}><Text style={s.link}>Already have an account? Sign in</Text></Pressable>
  </ScrollView></KeyboardAvoidingView>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background }, box: { padding: space.xxl, gap: space.xl, flexGrow: 1, maxWidth: 560, width: "100%", alignSelf: "center" }, pageTitle: { ...type.page, color: colors.text }, progress: { flexDirection: "row", justifyContent: "space-between" }, progressItem: { flex: 1, alignItems: "center", gap: space.xs }, dot: { height: 28, width: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.elevatedSurface }, dotActive: { backgroundColor: colors.primary }, dotText: { ...type.caption, color: colors.textSecondary, fontWeight: "700" }, dotTextActive: { color: "#fff" }, stepLabel: { ...type.caption, color: colors.textSecondary, textAlign: "center" }, stepLabelActive: { color: colors.text, fontWeight: "700" }, form: { gap: space.lg }, stepTitle: { ...type.page, color: colors.text }, input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: space.md, backgroundColor: colors.surface, color: colors.text, ...type.body }, error: { ...type.secondary, color: colors.error, marginTop: -space.sm }, hint: { ...type.secondary, marginTop: -space.sm, color: colors.textSecondary }, price: { paddingVertical: space.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.separator, flexDirection: "row", justifyContent: "space-between" }, priceTitle: { ...type.body, color: colors.text }, priceValue: { ...type.body, color: colors.text, fontWeight: "700" }, membershipNote: { ...type.secondary, color: colors.textSecondary }, actions: { gap: space.sm }, link: { ...type.body, color: colors.primary, fontWeight: "600", textAlign: "center", minHeight: 44 } });
