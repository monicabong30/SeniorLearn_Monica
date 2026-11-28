import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ScaledText as Text } from "../../src/components/ScaledText";
import { useAuth } from "../../src/context/Auth";
import { api } from "../../src/lib/api";
import { Card, PageTitle } from "../../src/components/ui";
import { canAdmin } from "../../src/lib/permissions";
import { colors, space, type } from "../../src/theme/tokens";
import {
  DateFilterSection,
  type DateFilterValue,
} from "../../src/components/DateFilterSection";
import { InteractiveLineChart as LineChart } from "../../src/components/InteractiveLineChart";
import { LoadingIndicator } from "../../src/components/LoadingIndicator";
function rangeParams(v: DateFilterValue, p: string) {
  return {
    [`${p}Start`]: v.startDate || undefined,
    [`${p}End`]: v.endDate || undefined,
  };
}
export default function Admin() {
  const { user } = useAuth(),
    router = useRouter(),
    [data, setData] = useState<any>(),
    [error, setError] = useState(false),
    [membership, setMembership] = useState<DateFilterValue>({
      type: "Date",
      startDate: "",
      endDate: "",
    }),
    [classes, setClasses] = useState<DateFilterValue>({
      type: "Date",
      startDate: "",
      endDate: "",
    }),
    [navigating, setNavigating] = useState(false),
    valid =
      !membership.startDate ||
      !membership.endDate ||
      membership.startDate <= membership.endDate,
    validClasses =
      !classes.startDate ||
      !classes.endDate ||
      classes.startDate <= classes.endDate;
  const params = useMemo(
      () => ({
        ...rangeParams(membership, "membership"),
        ...rangeParams(classes, "class"),
      }),
      [membership, classes],
    ),
    load = useCallback(() => {
      if (!valid || !validClasses) return;
      setError(false);
      void api
        .get("/admin/overview", { params })
        .then((r) => setData(r.data))
        .catch(() => setError(true));
    }, [params, valid, validClasses]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  if (!canAdmin(user))
    return (
      <View style={s.page}>
        <Text>Administrator access is required.</Text>
      </View>
    );
  if (!data && !error)
    return (
      <LoadingIndicator variant="fill" accessibilityLabel="Loading analytics" />
    );
  if (error)
    return (
      <View style={s.page}>
        <PageTitle title="Admin Dashboard" />
        <Text accessibilityRole="alert">
          Analytics are unavailable right now. Please try again later.
        </Text>
      </View>
    );
  const go = (
      path: "/admin/members" | "/admin/classes" | "/admin/bulletins",
    ) => {
      if (!navigating) {
        setNavigating(true);
        router.replace(path);
      }
    },
    kpis: [
      string,
      number,
      "/admin/members" | "/admin/classes" | "/admin/bulletins",
    ][] = [
      ["Total Members", data.members, "/admin/members"],
      ["Total Classes", data.classes, "/admin/classes"],
      ["Published Bulletins", data.bulletins, "/admin/bulletins"],
    ];
  return (
    <ScrollView contentContainerStyle={s.page}>
      <PageTitle
        title="Admin Dashboard"
        subtitle="Live administration overview."
      />
      <View style={s.kpis}>
        {kpis.map(([label, value, path]) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value}. Open management page`}
            disabled={navigating}
            onPress={() => go(path)}
            style={({ pressed }) => [s.kpiPress, pressed && s.pressed]}
          >
            <Card style={s.kpi}>
              <Text style={s.count}>{value}</Text>
              <Text style={s.kpiLabel}>{label}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
      <Text style={s.section}>Membership Analytics</Text>
      <DateFilterSection
        types={["Date"]}
        showTypes={false}
        value={membership}
        onChange={setMembership}
      />
      {!valid && (
        <Text accessibilityRole="alert" style={s.error}>
          Start Date must be on or before End Date.
        </Text>
      )}
      <LineChart
        title="Member Registrations by Current Role"
        series={data.membership.roleSeries}
        note="Registration date grouped by each member's current roles."
      />
      <LineChart
        title="New Member Registrations"
        series={[
          { name: "Registrations", points: data.membership.registrations },
        ]}
        note="Server-created registration timestamps, UTC."
      />
      <Text style={s.section}>Class Analytics</Text>
      <DateFilterSection
        types={["Date"]}
        showTypes={false}
        value={classes}
        onChange={setClasses}
      />
      {!validClasses && (
        <Text accessibilityRole="alert" style={s.error}>
          Start Date must be on or before End Date.
        </Text>
      )}
      <LineChart
        title="Classes by Occurrence Month and Current Status"
        series={data.classesAnalytics.statusSeries}
        note="Scheduled occurrence date grouped by current status."
      />
      <LineChart
        title="Class Activity"
        series={[
          { name: "Class occurrences", points: data.classesAnalytics.activity },
        ]}
        note="Includes every stored class occurrence, including cancelled classes."
      />
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    backgroundColor: colors.background,
  },
  kpis: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  kpiPress: { flexGrow: 1, flexBasis: 150, minWidth: 140, borderRadius: 16 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  // Let the card size itself from its text. A percentage height here inherits
  // the stretched flex-row height on Android and makes the cards fill the page.
  kpi: {},
  count: { fontSize: 30, fontWeight: "800", color: colors.primary },
  kpiLabel: { ...type.secondary, fontWeight: "700", color: colors.text },
  section: { ...type.section, color: colors.primary, marginTop: space.sm },
  chart: { gap: space.sm },
  chartTitle: { ...type.section, color: colors.text },
  note: { ...type.caption, color: colors.textSecondary },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...type.caption, color: colors.text },
  plot: {
    height: 145,
    marginHorizontal: 8,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: "#E8EEF4",
  },
  crosshair: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
    borderColor: "#7891A7",
    opacity: 0.8,
  },
  segment: {
    position: "absolute",
    height: 3,
    borderRadius: 2,
    transformOrigin: "left center" as any,
  },
  dot: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: -4.5,
    marginBottom: -4.5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  selectedDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    marginLeft: -6.5,
    marginBottom: -6.5,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  tooltip: {
    position: "absolute",
    width: 190,
    maxWidth: "92%",
    padding: space.sm,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#001A33",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tooltipTitle: {
    ...type.caption,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 2,
  },
  tooltipText: { ...type.caption, color: colors.text },
  xAxis: { flexDirection: "row", marginHorizontal: 8 },
  axis: {
    ...type.caption,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
  },
  compact: { ...type.caption, color: colors.textSecondary, fontWeight: "700" },
  controls: { flexDirection: "row", justifyContent: "space-between" },
  control: {
    ...type.caption,
    color: colors.primary,
    fontWeight: "700",
    paddingVertical: 4,
  },
  disabled: { color: colors.textSecondary, opacity: 0.5 },
  error: { ...type.secondary, color: colors.error },
});
