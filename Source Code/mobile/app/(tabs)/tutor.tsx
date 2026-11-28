import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/context/Auth";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import {
  AppButton,
  Card,
  PageTitle,
  StatusBadge,
} from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { canTutor } from '../../src/lib/permissions';
import { ConfirmationDialog } from "../../src/components/ConfirmationDialog";
import { LoadingIndicator } from "../../src/components/LoadingIndicator";
import { groupTutorClasses, seriesStatusSummary, type ClassTypeFilter } from "../../src/lib/tutorClassGrouping";
const statusFilters = ["ALL", "DRAFT", "SCHEDULED", "CLOSED", "COMPLETE", "CANCELLED"] as const;
const classTypeFilters: { value:ClassTypeFilter; label:string }[] = [{ value:"ALL", label:"All Classes" }, { value:"SINGLE", label:"Single Classes" }, { value:"RECURRING", label:"Recurring Classes" }];
type StatusFilter = (typeof statusFilters)[number];
const statusLabel = (status: StatusFilter) => status === "ALL" ? "All" : status[0] + status.slice(1).toLowerCase();
const emptyMessage = (type:ClassTypeFilter, status: StatusFilter) => status !== "ALL" ? `No ${status.toLowerCase()} classes.` : type === "RECURRING" ? "No recurring classes." : type === "SINGLE" ? "No single classes." : "No classes created yet.";
const schedule = (item: any) => {
  const start = new Date(item.startsAt),
    end = new Date(start.getTime() + item.durationMinutes * 60000);
  return {
    date: start.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
  };
};
export default function Tutor() {
  const { user } = useAuth(),
    router = useRouter(),
    { width } = useWindowDimensions(),
    [items, setItems] = useState<any[]>([]),
    [classTypeFilter, setClassTypeFilter] = useState<ClassTypeFilter>("ALL"),
    [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL"),
    [loading, setLoading] = useState(true),
    [pending, setPending] = useState<string | null>(null),
    [menu, setMenu] = useState<any>(),
    [cancelConfirmation, setCancelConfirmation] = useState<any>(),
    { show } = useFeedback(),
    wide = width >= 760;
  const load = async () => {
    try {
      setLoading(true);
      const rows = (await api.get("/classes", { params: { mine: "true" } }))
        .data;
      const withCounts = await Promise.all(
        rows.map(async (x: any) => {
          try {
            return {
              ...x,
              enrollmentCount: (await api.get(`/classes/${x._id}/roster`)).data
                .count,
            };
          } catch {
            return x;
          }
        }),
      );
      setItems(withCounts);
    } catch {
      show("ERROR", "Unable to load classes.");
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, []),
  );
  if (!canTutor(user))
    return (
      <View style={s.page}>
        <Text>Professional member access is required.</Text>
      </View>
    );
  const visibleItems = groupTutorClasses(items, classTypeFilter, statusFilter);
  const action = async (item: any, kind: "publish" | "cancel") => {
    setMenu(undefined);
    if (kind === "cancel") {
      setCancelConfirmation(item);
      return;
    }
    void mutate(item, kind);
  };
  const mutate = async (item: any, kind: "publish" | "cancel") => {
    try {
      setPending(`${kind}:${item._id}`);
      await api.post(`/classes/${item._id}/${kind}`);
      await load();
      if (kind === "cancel") setCancelConfirmation(undefined);
      show(
        "SUCCESS",
        kind === "publish"
          ? "Class published successfully."
          : "Class cancelled successfully.",
      );
    } catch {
      show("ERROR", "Unable to update this class.");
    } finally {
      setPending(null);
    }
  };
  const card = ({ item }: any) => {
    if (item.kind === "SERIES") {
      const first = item.items[0], last = item.items[item.items.length - 1], summary = seriesStatusSummary(item.items);
      const times = new Set<string>(item.items.map((row:any) => schedule(row).time)), capacities = new Set<number>(item.items.map((row:any) => row.capacity));
      const gap = item.items.length > 1 ? Math.round((+new Date(item.items[1].startsAt) - +new Date(first.startsAt)) / 86400000) : 7;
      return <Pressable accessibilityRole="link" accessibilityLabel={`View ${first.title} recurring classes`} onPress={() => router.push({ pathname:"/tutor/recurring/[seriesId]", params:{ seriesId:item.seriesId } })}><Card style={s.card}><View style={s.cardTop}><View style={s.cardTitle}><Text style={s.title}>{first.title}</Text><View style={s.recurring}><Text style={s.repeat}>↻</Text><Text style={s.recurringText}>Recurring class</Text></View><StatusBadge status={summary || 'DRAFT'} /></View><Text style={s.chevron}>›</Text></View><Text style={s.meta}>{gap === 14 ? "Every 2 weeks" : "Weekly"}</Text><Text style={s.meta}>{new Date(first.startsAt).toLocaleDateString("en-AU")} – {new Date(last.startsAt).toLocaleDateString("en-AU")}</Text><Text style={s.meta}>{times.size === 1 ? [...times][0] : "Various times"}</Text><Text style={s.meta}>{item.items.length} classes · {capacities.size === 1 ? `${first.capacity} seats per class` : "various capacities"}</Text><Text style={s.detailsText}>View Classes →</Text></Card></Pressable>;
    }
    const info = schedule(item);
    return (
      <Card style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardTitle}>
            <Text style={s.title}>{item.title}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${item.title}`}
            onPress={() => setMenu(item)}
            hitSlop={10}
            style={s.more}
          >
            <Text style={s.moreText}>⋯</Text>
          </Pressable>
        </View>
        <Text style={s.meta}>{info.date}</Text>
        <Text style={s.meta}>{info.time}</Text>
        {typeof item.enrollmentCount === "number" && (
          <Text style={s.meta}>
            {item.enrollmentCount} / {item.capacity} members enrolled
          </Text>
        )}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View details for ${item.title}`}
          onPress={() => router.push(`/class/${item._id}`)}
          style={s.details}
        >
          <Text style={s.detailsText}>View Details →</Text>
        </Pressable>
      </Card>
    );
  };
  return (
    <View style={s.page}>
      <FlatList
        key={wide ? "wide" : "narrow"}
        numColumns={wide ? 2 : 1}
        columnWrapperStyle={wide ? s.columns : undefined}
        contentContainerStyle={[
          s.list,
          { maxWidth: 1160, alignSelf: "center", width: "100%" },
        ]}
        ListHeaderComponent={
          <>
            <PageTitle
              title="Tutor dashboard"
              subtitle="Create, publish and manage your classes."
            />
            <View style={[s.quick, wide && s.quickWide]}>
              <AppButton
                label="Create class"
                onPress={() => router.push("/tutor/create")}
              />
              <AppButton
                label="Create recurring classes"
                variant="outline"
                onPress={() => router.push("/tutor/recurring-create")}
              />
            </View>
            <Text style={s.section}>My classes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters} accessibilityRole="radiogroup">{classTypeFilters.map(filter => <Pressable key={filter.value} accessibilityRole="radio" accessibilityState={{ selected: classTypeFilter === filter.value }} onPress={() => setClassTypeFilter(filter.value)} style={[s.filter, classTypeFilter === filter.value && s.filterSelected]}><Text style={[s.filterText, classTypeFilter === filter.value && s.filterTextSelected]}>{filter.label}</Text></Pressable>)}</ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters} accessibilityRole="radiogroup">{statusFilters.map(status => <Pressable key={status} accessibilityRole="radio" accessibilityState={{ selected: statusFilter === status }} onPress={() => setStatusFilter(status)} style={[s.filter, statusFilter === status && s.filterSelected]}><Text style={[s.filterText, statusFilter === status && s.filterTextSelected]}>{statusLabel(status)}</Text></Pressable>)}</ScrollView>
          </>
        }
        data={visibleItems}
        keyExtractor={(x) => "kind" in x ? `series:${x.seriesId}` : x._id}
        renderItem={card}
        refreshing={loading && items.length > 0}
        onRefresh={() => void load()}
        ListEmptyComponent={loading ? <LoadingIndicator accessibilityLabel="Loading classes" /> : <Text accessibilityRole="alert" style={s.empty}>{emptyMessage(classTypeFilter, statusFilter)}</Text>}
      />
      <Modal
        transparent
        visible={!!menu}
        animationType="fade"
        onRequestClose={() => setMenu(undefined)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss class actions"
          onPress={() => setMenu(undefined)}
          style={s.backdrop}
        >
          <View style={s.menu}>
            {menu && (
              <>
                <Text style={s.menuTitle}>{menu.title}</Text>
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => {
                    setMenu(undefined);
                    router.push({
                      pathname: "/tutor/edit",
                      params: { id: menu._id },
                    });
                  }}
                  style={s.menuItem}
                >
                  <Text>Edit class</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => {
                    setMenu(undefined);
                    router.push({
                      pathname: "/tutor/roster",
                      params: { id: menu._id },
                    });
                  }}
                  style={s.menuItem}
                >
                  <Text>Enrollment roster</Text>
                </Pressable>
                {menu.status === "DRAFT" && (
                  <Pressable
                    accessibilityRole="menuitem"
                    disabled={!!pending}
                    onPress={() => action(menu, "publish")}
                    style={s.menuItem}
                  >
                    <Text>Publish draft</Text>
                  </Pressable>
                )}
                {!["CANCELLED", "COMPLETE"].includes(menu.status) && (
                  <Pressable
                    accessibilityRole="menuitem"
                    disabled={!!pending}
                    onPress={() => action(menu, "cancel")}
                    style={s.menuItem}
                  >
                    <Text style={s.destructive}>Cancel class</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
      <ConfirmationDialog
        visible={!!cancelConfirmation}
        title="Cancel class?"
        message="This will cancel the class for enrolled members."
        confirmLabel="Cancel class"
        cancelLabel="Keep class"
        variant="destructive"
        loading={pending === `cancel:${cancelConfirmation?._id}`}
        onDismiss={() => setCancelConfirmation(undefined)}
        onConfirm={() => void mutate(cancelConfirmation, "cancel")}
      />
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md, paddingBottom: 110 },
  columns: { gap: space.md },
  quick: { gap: space.sm, marginBottom: space.xl },
  quickWide: { flexDirection: "row", alignItems: "center" },
  section: { ...type.section, color: colors.primary, marginBottom: space.sm },
  filters: { gap: space.sm, paddingBottom: space.md, paddingRight: space.lg },
  filter: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.md, borderRadius: 22, backgroundColor: colors.elevatedSurface },
  filterSelected: { backgroundColor: colors.primary },
  filterText: { color: colors.text, fontWeight: "700" },
  filterTextSelected: { color: "#fff" },
  empty: { color: colors.textSecondary, textAlign: "center", padding: space.lg },
  card: { flex: 1, marginBottom: space.md, gap: space.sm },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space.sm,
  },
  cardTitle: { flex: 1, gap: space.xs },
  title: { ...type.section, color: colors.primary },
  meta: { color: colors.textSecondary },
  recurring: { flexDirection: "row", alignItems: "center", gap: space.xs },
  repeat: { color: colors.primary, fontSize: 18, fontWeight: "700" },
  recurringText: { color: colors.primary, fontWeight: "700" },
  chevron: { color: colors.primary, fontSize: 32, lineHeight: 32 },
  more: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  moreText: {
    fontSize: 28,
    lineHeight: 28,
    color: colors.primary,
    fontWeight: "700",
  },
  details: { alignSelf: "flex-start", paddingVertical: space.xs },
  detailsText: { color: colors.primary, fontWeight: "700" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.35)",
    justifyContent: "center",
    padding: space.lg,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.md,
    gap: space.xs,
    maxWidth: 360,
    width: "100%",
    alignSelf: "center",
  },
  menuTitle: { ...type.section, color: colors.primary, marginBottom: space.xs },
  menuItem: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.sm,
    borderRadius: 8,
  },
  destructive: { color: colors.error, fontWeight: "700" },
});
