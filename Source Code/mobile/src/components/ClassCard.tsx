import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { enrollmentLabel, enrollmentState } from "../lib/enrollmentStatus";
import { classSchedule } from "../lib/classFormat";
import { Card, StatusBadge } from "./ui";
import { FavouriteButton } from "./FavouriteButton";
import { colors, space, type } from "../theme/tokens";
import { ScaledText as Text } from "./ScaledText";
export function ClassCard({ item, enrollments = [] }: any) {
  const state = enrollmentState(item, enrollments),
    router = useRouter();
  return (
    <Card>
      <View style={s.top}>
        <View style={s.titleRow}>
          <Text style={s.title}>{item.title}</Text>
          <FavouriteButton classId={item._id} />
        </View>
        <StatusBadge status={enrollmentLabel(state)} />
      </View>
      <Text style={s.meta}>{classSchedule(item.startsAt)}</Text>
      <Text style={s.meta}>
        {item.delivery === "ONLINE"
          ? "Online via Microsoft Teams"
          : `In person${item.address ? ` · ${item.address}` : ""}`}
      </Text>
      <Text style={s.meta}>
        Presented by {item.tutor?.name || "SeniorLearn tutor"}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View details for ${item.title}`}
        onPress={() => router.push(`/class/${item._id}`)}
        style={({ pressed }) => [s.details, pressed && s.pressed]}
      >
        <Text style={s.action}>View Details →</Text>
      </Pressable>
    </Card>
  );
}
const s = StyleSheet.create({
  top: { gap: space.sm },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  title: { ...type.section, color: colors.text, flex: 1 },
  meta: { ...type.secondary, color: colors.textSecondary },
  details: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginTop: space.xs,
  },
  action: { ...type.body, color: colors.primary, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
