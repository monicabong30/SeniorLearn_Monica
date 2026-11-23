import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { FavouriteButton } from "../../src/components/FavouriteButton";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import {
  AppButton,
  Card,
  PageTitle,
  StatusBadge,
} from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";

export default function Favourites() {
  const [rows, setRows] = useState<any[]>([]),
    [loading, setLoading] = useState(true);
  const { show } = useFeedback();
  const router = useRouter();
  const load = async () => {
    try {
      setLoading(true);
      setRows((await api.get("/favourites")).data);
    } catch {
      show("ERROR", "Unable to update Favourites.");
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
      data={rows}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={load}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <PageTitle
          title="Favourites"
          subtitle="Classes you have saved to revisit."
        />
      }
      renderItem={({ item }) => (
        <Card>
          <View style={s.row}>
            <Text style={s.title}>{item.class.title}</Text>
            <FavouriteButton classId={item.class._id} onChanged={load} />
          </View>
          <StatusBadge
            status={
              item.class.status === "CANCELLED"
                ? "Class Cancelled"
                : "Favourite"
            }
          />
          <Text>{new Date(item.class.startsAt).toLocaleString()}</Text>
          <Text>
            Presented by {item.class.tutor?.name || "SeniorLearn tutor"}
          </Text>
          {item.updates?.length ? (
            <>
              <Text accessibilityRole="alert" style={s.updated}>
                Updated
              </Text>
              <Text>
                {item.updates[0].changes
                  .map(
                    (change: any) =>
                      `${change.field}: ${String(change.previous)} → ${String(change.current)}`,
                  )
                  .join("\n")}
              </Text>
              <AppButton
                label="Mark as Seen"
                variant="outline"
                onPress={async () => {
                  try {
                    await api.put(`/favourites/${item.class._id}/seen`);
                    await load();
                    show("SUCCESS", "Changes marked as seen.");
                  } catch {
                    show("ERROR", "Unable to update Favourites.");
                  }
                }}
              />
            </>
          ) : null}
          <AppButton
            label="View Details"
            variant="outline"
            onPress={() => router.push(`/class/${item.class._id}`)}
          />
        </Card>
      )}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={s.empty}>
            <Text style={s.title}>No favourite classes yet.</Text>
            <Text>Tap the heart on a class to save it here.</Text>
            <AppButton
              label="Browse Classes"
              onPress={() => router.navigate("/(tabs)")}
            />
          </View>
        )
      }
    />
  );
}
const s = StyleSheet.create({
  page: { backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...type.section, color: colors.primary, flex: 1 },
  updated: { color: colors.warning, fontWeight: "700" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xxxl,
    gap: space.md,
  },
});
