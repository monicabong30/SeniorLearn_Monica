import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../src/lib/api";
import { Card, PageTitle } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { ScaledText as Text } from "../../src/components/ScaledText";
import { NotificationBody } from "../../src/components/NotificationBody";
export default function NotificationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    [item, setItem] = useState<any>();
  useEffect(() => {
    let active = true;
    void api
      .get("/notifications")
      .then(async (r) => {
        const found = r.data.find((x: any) => x._id === id);
        if (!active) return;
        setItem(found || null);
        if (found && !found.readAt) await api.put(`/notifications/${id}/read`);
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
        <PageTitle title="Alert unavailable" />
      </View>
    );
  return (
    <ScrollView contentContainerStyle={s.page}>
      <PageTitle title={item.title} />
      <Card>
        <NotificationBody item={item} />
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
  body: { ...type.body, color: colors.text },
});
