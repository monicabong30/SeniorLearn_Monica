import { ScaledText as Text } from "../../src/components/ScaledText";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { api } from "../../src/lib/api";
import { Card, Field, PageTitle, StatusBadge } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
export default function Roster() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    [data, setData] = useState<any>({ enrollments: [] }),
    [q, setQ] = useState(""),
    [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    setRefreshing(true);
    try {
      setData((await api.get(`/classes/${id}/roster`)).data);
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void load();
  }, [id]);
  const rows = data.enrollments.filter((x: any) =>
    `${x.user?.name || ""} ${x.user?.email || ""}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <FlatList
      style={s.page}
      contentContainerStyle={s.list}
      ListHeaderComponent={
        <>
          <PageTitle
            title="Enrollment roster"
            subtitle={`Active enrolments: ${data.count || 0} of ${data.capacity || 0}`}
          />
          <Field
            label="Search enrolled members"
            placeholder="Search members..."
            value={q}
            onChangeText={setQ}
          />
        </>
      }
      data={rows}
      keyExtractor={(x) => x._id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={load}
          tintColor={colors.primary}
        />
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={s.name}>{item.user?.name || "Member"}</Text>
          <Text>{item.user?.email || "Email not available"}</Text>
          <StatusBadge status={item.status} />
        </Card>
      )}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.name}>No matching enrolments</Text>
          <Text>Enrolled members will appear here.</Text>
        </View>
      }
    />
  );
}
const s = StyleSheet.create({
  page: { backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md },
  name: { ...type.section, color: colors.primary },
  empty: { padding: space.xxxl, alignItems: "center", gap: space.sm },
});
