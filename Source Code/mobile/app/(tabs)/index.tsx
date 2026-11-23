import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { api } from "../../src/lib/api";
import { ClassCard } from "../../src/components/ClassCard";
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
  "Not Available",
];
const labels: Record<ClassSort, string> = {
  Earliest: "Earliest date",
  Latest: "Latest date",
  Title: "Title A–Z",
};
export default function Classes() {
  const [items, setItems] = useState<any[]>([]),
    [enrollments, setEnrollments] = useState<any[]>([]),
    [favourites, setFavourites] = useState<any[]>([]),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState<ClassFilter>("All"),
    [sort, setSort] = useState<ClassSort>("Earliest"),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const [c, e, f] = await Promise.all([
        api.get("/classes", { params: { search } }),
        api.get("/enrollments"),
        api.get("/favourites"),
      ]);
      setItems(c.data);
      setEnrollments(e.data);
      setFavourites(f.data);
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [search]),
  );
  const shown = useMemo(
    () => filterAndSortClasses(items, enrollments, favourites, filter, sort),
    [items, enrollments, favourites, filter, sort],
  );
  const header = (
    <View style={s.header}>
      <PageTitle
        title="Find your next class"
        subtitle="Explore something new at your own pace."
      />
      <View>
        <Field
          label="Search classes"
          placeholder="Try computers, art or wellbeing"
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${labels[sort]}`}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(true)}
          style={s.select}
        >
          <Text style={s.selectText}>
            {labels[sort]} ⌄
          </Text>
        </Pressable>
      </View>
      {(filter !== "All" || sort !== "Earliest") && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFilter("All");
            setSort("Earliest");
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
        data={shown}
        keyExtractor={(x) => x._id}
        renderItem={({ item }) => (
          <ClassCard item={item} enrollments={enrollments} />
        )}
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
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sort options"
          onPress={() => setOpen(false)}
          style={s.overlay}
        >
          <View style={s.menu}>
            {(["Earliest", "Latest", "Title"] as ClassSort[]).map((x) => (
              <Pressable
                key={x}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: sort === x }}
                onPress={() => {
                  setSort(x);
                  setOpen(false);
                }}
                style={[s.option, sort === x && s.optionOn]}
              >
                <Text style={[s.optionText, sort === x && s.optionTextOn]}>
                  {labels[x]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  select: {
    minHeight: 44,
    paddingHorizontal: space.md,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  selectText: { color: colors.primary, fontWeight: "700" },
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
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: space.xl,
    backgroundColor: "#0005",
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: space.sm,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    gap: space.xs,
  },
  option: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderRadius: 10,
  },
  optionOn: { backgroundColor: "#e8eff5" },
  optionText: { color: colors.text },
  optionTextOn: { color: colors.primary, fontWeight: "700" },
});
