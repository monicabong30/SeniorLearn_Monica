import { ScaledText as Text } from "../../src/components/ScaledText";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/Auth";
import { usePreferences } from "../../src/context/Preferences";
import { Card, PageTitle } from "../../src/components/ui";
import { colors, space } from "../../src/theme/tokens";
import { canTutor } from "../../src/lib/permissions";
const faqs = [
  [
    "Getting Started",
    "How do I register?",
    "Use the Register link on the sign-in screen, enter your details, then sign in.",
    "/(auth)/register",
  ],
  [
    "Classes",
    "How do I find a class?",
    "Open Classes, use search or the filters, and select View details.",
    "/(tabs)",
  ],
  [
    "Favourites",
    "How do I save a class?",
    "Tap the heart on a class card or its detail screen. Your saved classes appear in Favourites.",
    "/(tabs)/favourites",
  ],
  [
    "My Learning",
    "Where are my enrolments?",
    "Open My Learning to see upcoming classes, calendar dates and history.",
    "/(tabs)/enrolments",
  ],
  [
    "Membership",
    "How do I view membership details?",
    "Open Profile to see your membership status and expiry date.",
    "/(tabs)/profile",
  ],
  [
    "Security",
    "How do I change my password?",
    "Open Profile, then Account Security. You must enter your current password.",
    "/account-security",
  ],
  [
    "Tutor/Admin",
    "How do I manage classes?",
    "Tutors can use the Tutor tab to create, edit and view their class rosters.",
    "/(tabs)/tutor",
  ],
];
export default function Help() {
  const [q, setQ] = useState(""),
    [open, setOpen] = useState<string | null>(null),
    router = useRouter(),
    { user } = useAuth(),
    { fontScale } = usePreferences(),
    rows = useMemo(
      () =>
        faqs.filter(
          (x) =>
            (canTutor(user) || x[0] !== "Tutor/Admin") &&
            x.join(" ").toLowerCase().includes(q.toLowerCase()),
        ),
      [q, user],
    );
  return (
    <ScrollView contentContainerStyle={s.page}>
      <PageTitle title="Help & Support" subtitle="How can we help you?" />
      <TextInput
        accessibilityLabel="Search help"
        placeholder="Search help topics..."
        value={q}
        onChangeText={setQ}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        style={[s.search, { fontSize: 17 * fontScale, lineHeight: 25 * fontScale }]}
      />
      {rows.map(([section, question, answer, path]) => (
        <Card key={question}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(open === question ? null : question)}
          >
            <Text style={s.section}>{section}</Text>
            <Text style={s.question}>
              {question} {open === question ? "−" : "+"}
            </Text>
          </Pressable>
          {open === question && (
            <View style={s.answer}>
              <Text>{answer}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(path as any)}
              >
                <Text style={s.link}>Go there</Text>
              </Pressable>
            </View>
          )}
        </Card>
      ))}
      {!rows.length && <Text>No help topics matched your search.</Text>}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    padding: space.lg,
    gap: space.md,
    backgroundColor: colors.background,
  },
  search: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 17,
  },
  section: { color: colors.primary, fontWeight: "700" },
  question: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  answer: { gap: 12, marginTop: 8 },
  link: { color: colors.primary, fontWeight: "700", fontSize: 16 },
});
