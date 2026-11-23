import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import { Card, PageTitle, StatusBadge } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { NotificationBody } from "../../src/components/NotificationBody";
export default function Notifications() {
  const [items, setItems] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    { show } = useFeedback(),
    router = useRouter();
  const load = async () => {
    try {
      setLoading(true);
      setItems((await api.get("/notifications")).data);
    } catch {
      show("ERROR", "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, []),
  );
  return (
    <FlatList
      style={s.page}
      contentContainerStyle={s.list}
      ListHeaderComponent={
        <PageTitle
          title="Alerts"
          subtitle="Important updates about your learning."
        />
      }
      data={items}
      refreshing={loading}
      onRefresh={load}
      keyExtractor={(x) => x._id}
      renderItem={({ item }) => (
        <Card>
          <StatusBadge status={item.readAt ? "Read" : "Unread"} />
          <Text style={s.title}>{item.title}</Text>
          <NotificationBody item={item} numberOfLines={2} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/notification/${item._id}`)}
            style={s.link}
          >
            <Text style={s.linkText}>View details →</Text>
          </Pressable>
        </Card>
      )}
      ListEmptyComponent={
        loading ? (
          <View style={s.empty}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={s.empty}>
            <Text style={s.title}>You’re all caught up</Text>
            <Text>No notifications yet.</Text>
          </View>
        )
      }
    />
  );
}
const s = StyleSheet.create({
  page: { backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md },
  title: { ...type.section, color: colors.primary },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: colors.primary, fontWeight: "700" },
  empty: { padding: space.xxxl, alignItems: "center", gap: space.sm },
});
