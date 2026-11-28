import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { api } from "../../src/lib/api";
import { useFeedback } from "../../src/context/Feedback";
import { ClassCard } from "../../src/components/ClassCard";
import { RecurringClassCard } from "../../src/components/RecurringClassCard";
import { AnchoredDropdown } from "../../src/components/AnchoredDropdown";
import { Field, PageTitle } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import {
  ClassFilter,
  ClassSort,
  filterAndSortClasses,
} from "../../src/lib/classFilters";
const filters: ClassFilter[] = [
  "All",
  "Available",
  "Enrolled",
  "Favourites",
  "Past classes",
  "Not Available",
];
const labels: Record<ClassSort, string> = {
  Upcoming: "Upcoming classes first",
  Furthest: "Furthest date first",
  TitleAsc: "Class name (A–Z)",
  TitleDesc: "Class name (Z–A)",
};
export default function Classes() {
  const [items, setItems] = useState<any[]>([]),
    [enrollments, setEnrollments] = useState<any[]>([]),
    [favourites, setFavourites] = useState<any[]>([]),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState<ClassFilter>("All"),
    [sort, setSort] = useState<ClassSort>("Upcoming"),
    [loading, setLoading] = useState(true);
  const { show } = useFeedback();
  const load = async () => {
    setLoading(true);
    try {
      const c = await api.get("/classes", { params: { search } });
      const [e, f] = await Promise.allSettled([
        api.get("/enrollments"),
        api.get("/favourites"),
      ]);
      setItems(c.data);
      // Pending and expired members can browse, but cannot access their
      // enrolment or favourite data until membership is active.
      setEnrollments(e.status === "fulfilled" ? e.value.data : []);
      setFavourites(f.status === "fulfilled" ? f.value.data : []);
    } catch {
      setItems([]);
      setEnrollments([]);
      setFavourites([]);
      show("ERROR", "Unable to load classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [search, show]),
  );
  const shown = useMemo(
    () => filterAndSortClasses(items, enrollments, favourites, filter, sort),
    [items, enrollments, favourites, filter, sort],
  );
  const cards=useMemo(()=>{const singles=shown.filter((item:any)=>!item.recurrenceSeriesId), groups=new Map<string,any[]>(); shown.filter((item:any)=>item.recurrenceSeriesId).forEach((item:any)=>groups.set(item.recurrenceSeriesId,[...(groups.get(item.recurrenceSeriesId)||[]),item])); return [...singles,...[...groups.values()].map(items=>({kind:'SERIES',_id:`series:${items[0].recurrenceSeriesId}`,items}))];},[shown]);
  const header = (
    <View style={s.header}>
      <PageTitle
        title="Find your next class"
        subtitle="Explore something new at your own pace."
      />
      <View>
        <Field
          label="Search classes"
          placeholder="Search classes..."
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear class search"
            onPress={() => setSearch("")}
            style={s.clear}
          >
            <Text style={s.clearText}>Clear search</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        <View style={s.chipRow}>
          {filters.map((x) => (
            <Pressable
              key={x}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === x }}
              onPress={() => setFilter(x)}
              style={[s.chip, filter === x && s.chipOn]}
            >
              <Text style={[s.chipText, filter === x && s.chipTextOn]}>
                {x}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={s.sortRow}>
        <Text style={s.sortLabel}>
          Sort by:
        </Text>
        <AnchoredDropdown label="Sort classes" value={sort} options={(Object.keys(labels) as ClassSort[]).map(value => ({ value, label: labels[value] }))} onChange={setSort} />
      </View>
      {(filter !== "All" || sort !== "Upcoming") && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFilter("All");
            setSort("Upcoming");
          }}
          style={s.clear}
        >
          <Text style={s.clearText}>Clear filters</Text>
        </Pressable>
      )}
    </View>
  );
  return (
    <>
      <FlatList
        style={s.page}
        contentContainerStyle={s.list}
        ListHeaderComponent={header}
        data={cards}
        keyExtractor={(x) => x._id}
        renderItem={({ item }:any) => item.kind==='SERIES'?<RecurringClassCard items={item.items} enrollments={enrollments}/>:<ClassCard item={item} enrollments={enrollments} />}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={s.state}>
              <ActivityIndicator color={colors.primary} />
              <Text>Finding classes…</Text>
            </View>
          ) : (
            <View style={s.state}>
              <Text style={s.emptyTitle}>No classes found</Text>
              <Text>Try clearing filters or searching for another topic.</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
      />
    </>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: space.lg, paddingBottom: 100, width: "100%", maxWidth: 760, alignSelf: "center" },
  header: { gap: space.md, paddingBottom: space.md },
  chips: { paddingVertical: space.xs },
  chipRow: { flexDirection: "row", gap: space.sm, alignItems: "center" },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: "700" },
  chipTextOn: { color: "#fff" },
  sortRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  sortLabel: { fontWeight: "700", color: colors.text },
  separator: { height: space.md },
  state: { padding: space.xxxl, alignItems: "center", gap: space.sm },
  emptyTitle: { ...type.section, color: colors.primary },
  clear: {
    alignSelf: "flex-start",
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  clearText: { color: colors.primary, fontWeight: "700" },
});
