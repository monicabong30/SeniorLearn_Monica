import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../src/lib/api";
import { Card, PageTitle } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { ScaledText as Text } from "../../src/components/ScaledText";
export default function BulletinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    [item, setItem] = useState<any>();
  useEffect(() => {
    let active = true;
    void api
      .get(`/bulletins/${id}`)
      .then(async (r) => {
        if (!active) return;
        setItem(r.data);
        if (!r.data.readAt) await api.put(`/bulletins/${id}/read`);
      })
      .catch(() => active && setItem(null));
    return () => {
      active = false;
    };
  }, [id]);
  if (item === undefined)
    return (
      <View style={s.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (item === null)
    return (
      <View style={s.page}>
        <PageTitle title="Bulletin unavailable" />
      </View>
    );
  return (
    <ScrollView contentContainerStyle={s.page}>
      <PageTitle title={item.title} />
      <Card>
        <Text style={s.date}>
          {item.publishedAt && new Date(item.publishedAt).toLocaleDateString()}
        </Text>
        <Text style={s.body}>{item.body}</Text>
      </Card>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    padding: space.lg,
    gap: space.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  date: { ...type.caption, color: colors.textSecondary },
  body: { ...type.body, color: colors.text },
});
