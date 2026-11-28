import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  activeEnrolments,
  dayKey,
  enrolmentsOnDay,
  monthCells,
} from "../../src/lib/calendar";
import { classSchedule } from "../../src/lib/classFormat";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import { AppButton, Card, Field, PageTitle, StatusBadge } from "../../src/components/ui";
import { LoadingIndicator } from "../../src/components/LoadingIndicator";
import { colors, space, type } from "../../src/theme/tokens";
import { ScaledText as Text } from "../../src/components/ScaledText";
import { MonthYearWheelPicker } from "../../src/components/MonthYearWheelPicker";

type Section = "Upcoming" | "Calendar" | "History";
type HistoryFilter = "All" | "Completed" | "Cancelled";
const label = (value: string) =>
  value === "ACTIVE" ? "Enrolled" : value === "CANCELLED" ? "Cancelled" : value;

export default function Enrolments() {
  const [rows, setRows] = useState<any[]>([]);
  const [section, setSection] = useState<Section>("Upcoming");
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("All");
  const { show } = useFeedback();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const load = async () => {
    try {
      setLoadError("");
      const { data } = await api.get("/enrollments");
      // No enrolments is a normal successful state, not an application error.
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setLoadError("Unable to load enrolments.");
      show("ERROR", "Unable to load enrolments.");
    } finally {
      setInitialLoading(false);
    }
  };
  const refresh = async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, []),
  );
  const active = useMemo(() => activeEnrolments(rows), [rows]);
  const today = new Date();
  const upcoming = active
    .filter((item) => new Date(item.class!.startsAt) >= today)
    .sort(
      (a, b) => +new Date(a.class!.startsAt) - +new Date(b.class!.startsAt),
    );
  const history = rows.filter((item) => {
    const status = item.status === "CANCELLED" ? "Cancelled" : item.class?.status === "CANCELLED" ? "Cancelled" : new Date(item.class?.startsAt) < today ? "Completed" : "";
    return !!status && (historyFilter === "All" || historyFilter === status) && (item.class?.title || "").toLowerCase().includes(historySearch.toLowerCase());
  });
  const cells = monthCells(month);
  const selectedRows = selected ? enrolmentsOnDay(rows, selected) : [];
  const cards = (items: any[]) =>
    items.map((item) => {
      const c = item.class;
      return (
        <Card key={item._id}>
          <Text style={s.title}>{c?.title || "Class no longer available"}</Text>
          <StatusBadge status={label(item.status)} />
          {c && (
            <>
              <Text style={s.meta}>{classSchedule(c.startsAt)}</Text>
              <Text style={s.meta}>
                {c.delivery === "ONLINE"
                  ? "Online · Microsoft Teams"
                  : `In person${c.address ? ` · ${c.address}` : ""}`}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/class/${c._id}`)}
                style={s.link}
              >
                <Text style={s.linkText}>View details →</Text>
              </Pressable>
            </>
          )}
        </Card>
      );
    });
  const calendar = (
    <View>
      <View style={s.monthBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => {
            setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1));
            setSelected(null);
          }}
          style={s.monthNav}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose month and year"
          onPress={() => setPicker(true)}
          style={s.monthPick}
        >
          <Text accessibilityRole="header" style={s.month}>
            {month.toLocaleString("en-AU", { month: "long", year: "numeric" })}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => {
            setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1));
            setSelected(null);
          }}
          style={s.monthNav}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </Pressable>
      </View>
      <View style={s.grid}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <Text key={day} style={s.weekday}>{day}</Text>)}
        {cells.map((date, index) =>
          !date ? (
            <View key={`b${index}`} style={s.day} />
          ) : (
            <Pressable
              key={dayKey(date)}
              onPress={() => setSelected(dayKey(date))}
              style={[s.day, selected === dayKey(date) && s.selectedDay]}
            >
              <Text>{date.getDate()}</Text>
              {enrolmentsOnDay(rows, dayKey(date)).length > 0 && (
                <View accessibilityLabel="Enrolled class" style={s.dot} />
              )}
            </Pressable>
          ),
        )}
      </View>
      {selected ? (
        <View style={s.dayResults}>{cards(selectedRows)}</View>
      ) : (
        <Text style={s.empty}>Select a date to view enrolled classes.</Text>
      )}
    </View>
  );
  const historyCards = <><Field label="Search learning history" placeholder="Search your learning history..." value={historySearch} onChangeText={setHistorySearch}/><View style={s.filters}>{(["All", "Completed", "Cancelled"] as HistoryFilter[]).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{selected: historyFilter === value}} onPress={() => setHistoryFilter(value)} style={[s.filter, historyFilter === value && s.filterOn]}><Text>{value}</Text></Pressable>)}</View>{history.map(item => { const c=item.class, status=item.status === "CANCELLED" ? "Enrollment Cancelled" : c?.status === "CANCELLED" ? "Class Cancelled" : "Class date passed"; return <Card key={item._id}><Text style={s.title}>{c?.title || "Class no longer available"}</Text><StatusBadge status={status}/>{c?.startsAt && <Text style={s.meta}>{classSchedule(c.startsAt)}</Text>}<Text style={s.meta}>{item.status === "CANCELLED" ? "You cancelled this enrollment." : c?.status === "CANCELLED" ? "The tutor cancelled this class." : "Scheduled class date has passed."}</Text><Pressable accessibilityRole="link" onPress={() => router.push(`/history/${item._id}`)} style={s.link}><Text style={s.linkText}>View History →</Text></Pressable></Card>})}{!history.length && <Text style={s.empty}>No learning history matches your search.</Text>}</>;
  return (
    <>
      <FlatList
        style={s.page}
        contentContainerStyle={s.list}
        data={[section]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        keyExtractor={(value) => value}
        ListHeaderComponent={
          <>
            <PageTitle
              title="My learning"
              subtitle="Your enrolled classes and learning history."
            />
            <View style={s.segments}>
              {(["Upcoming", "Calendar", "History"] as Section[]).map(
                (value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="tab"
                    onPress={() => setSection(value)}
                    style={[s.segment, section === value && s.selectedSegment]}
                  >
                    <Text>{value}</Text>
                  </Pressable>
                ),
              )}
            </View>
          </>
        }
        renderItem={() =>
          initialLoading ? <LoadingIndicator accessibilityLabel="Loading enrolments" /> : loadError ? <View style={s.state}><Text accessibilityRole="alert" style={s.empty}>{loadError}</Text><AppButton label="Try again" variant="outline" onPress={() => void load()} /></View> : section === "Upcoming" ? (
            <>
              {cards(upcoming)}
              {!upcoming.length && (
                <Text style={s.empty}>No upcoming enrolled classes.</Text>
              )}
            </>
          ) : section === "History" ? (
            historyCards
          ) : (
            calendar
          )
        }
      />
      <MonthYearWheelPicker visible={picker} month={month.getMonth()} year={month.getFullYear()} minYear={today.getFullYear() - 10} maxYear={today.getFullYear() + 10} onDismiss={() => setPicker(false)} onDone={(nextMonth, nextYear) => { setMonth(new Date(nextYear, nextMonth, 1)); setSelected(null); setPicker(false); }} />
    </>
  );
}
const s = StyleSheet.create({
  page: { backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md },
  segments: {
    flexDirection: "row",
    backgroundColor: "#e8eff5",
    borderRadius: 12,
    padding: 3,
    marginBottom: space.md,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSegment: { backgroundColor: colors.surface },
  filters: { flexDirection: "row", gap: space.sm, flexWrap: "wrap" },
  filter: { minHeight: 44, paddingHorizontal: space.md, justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 22 },
  filterOn: { backgroundColor: "#e0efff", borderColor: colors.primary },
  title: { ...type.section, color: colors.primary },
  meta: { color: colors.textSecondary },
  link: { minHeight: 44, justifyContent: "center", marginTop: 4 },
  linkText: { color: colors.primary, fontWeight: "700" },
  empty: {
    padding: space.xxl,
    textAlign: "center",
    color: colors.textSecondary,
  },
  state: { alignItems: "center", gap: space.sm },
  monthBar: { flexDirection: "row", alignItems: "center" },
  monthNav: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  monthPick: { flex: 1, minHeight: 44, justifyContent: "center" },
  month: {
    textAlign: "center",
    fontSize: 19,
    fontWeight: "700",
    color: colors.primary,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  weekday: { width: "14.285%", textAlign: "center", fontWeight: "700", color: colors.textSecondary, marginBottom: 4 },
  day: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  selectedDay: { backgroundColor: "#e0efff" },
  dayResults: { gap: space.md, marginTop: space.lg },
  modal: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0008" },
  sheet: {
    maxHeight: "70%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.lg,
    gap: space.md,
  },
  option: {
    minHeight: 48,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 18, color: colors.text },
  close: { alignItems: "center", minHeight: 44, justifyContent: "center" },
});
