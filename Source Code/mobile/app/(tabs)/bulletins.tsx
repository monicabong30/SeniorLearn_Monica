import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { api } from "../../src/lib/api";
import { Card, PageTitle, StatusBadge } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
export default function Bulletins() {
  const [items, setItems] = useState<any[]>([]), [refreshing, setRefreshing] = useState(false),
    router = useRouter();
  const load = useCallback(async () => { setRefreshing(true); try { setItems((await api.get("/bulletins")).data); } finally { setRefreshing(false); } }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <FlatList
      style={s.page}
      contentContainerStyle={s.list}
      ListHeaderComponent={
        <PageTitle
          title="Bulletins"
          subtitle="News and updates from SeniorLearn."
        />
      }
      data={items}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
      keyExtractor={(x) => x._id}
      renderItem={({ item }) => (
        <Card>
          <StatusBadge status={item.readAt ? "Read" : "New"} />
          <Text style={s.title}>{item.title}</Text>
          {item.publishedAt && (
            <Text style={s.date}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          )}
          <Text style={s.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/bulletin/${item._id}`)}
            style={s.link}
          >
            <Text style={s.linkText}>View details →</Text>
          </Pressable>
        </Card>
      )}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.title}>No bulletins yet</Text>
          <Text>New announcements will appear here.</Text>
        </View>
      }
    />
  );
}
const s = StyleSheet.create({
  page: { backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md },
  title: { ...type.section, color: colors.primary },
  body: { ...type.body, color: colors.text },
  date: { ...type.caption, color: colors.textSecondary },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: colors.primary, fontWeight: "700" },
  empty: { padding: space.xxxl, alignItems: "center", gap: space.sm },
});
