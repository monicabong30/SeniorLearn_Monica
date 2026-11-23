import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
type Point = { key: string; count: number | null };
type Series = { name: string; points: Point[] };
const palette = [colors.primary, "#007C91", "#8055A5", "#BD6A30", "#4E7B46"];
const short = (key: string) =>
  new Date(
    `${key}${key.length === 7 ? "-01" : ""}T00:00:00Z`,
  ).toLocaleDateString("en-AU", {
    day: key.length === 10 ? "numeric" : undefined,
    month: "short",
    timeZone: "UTC",
  });
function LineChart({
  title,
  series,
  note,
}: {
  title: string;
  series: Series[];
  note?: string;
}) {
  const [size, setSize] = useState({ width: 0, height: 145 }),
    [selected, setSelected] = useState<string>();
  const points = series
      .flatMap((x) => x.points)
      .filter((x): x is { key: string; count: number } => x.count !== null),
    max = Math.max(1, ...points.map((x) => x.count)),
    pad = 6,
    w = Math.max(1, size.width - pad * 2),
    h = Math.max(1, size.height - pad * 2),
    periods = series[0]?.points || [];
  const position = (point: Point, index: number, length: number) => ({
    x: pad + (length < 2 ? w / 2 : (index / (length - 1)) * w),
    y: pad + ((point.count || 0) / max) * h,
  });
  const total = (line: Series) =>
    line.points.reduce((sum, p) => sum + (p.count || 0), 0);
  const selectedIndex = Math.max(
    0,
    periods.findIndex((p) => p.key === selected),
  );
  const detailKey = periods[selectedIndex]?.key;
  const selectX = (x: number) => {
    if (!periods.length) return;
    const index =
      periods.length === 1
        ? 0
        : Math.max(
            0,
            Math.min(
              periods.length - 1,
              Math.round(((x - pad) / w) * (periods.length - 1)),
            ),
          );
    const key = periods[index].key;
    if (key !== selected) setSelected(key);
  };
  const selectedPoint =
      periods[selectedIndex] &&
      position(periods[selectedIndex], selectedIndex, periods.length),
    tooltipLeft = selectedPoint
      ? Math.max(4, Math.min(size.width - 194, selectedPoint.x - 95))
      : 4,
    tooltipBottom = selectedPoint
      ? selectedPoint.y < h - 92
        ? selectedPoint.y + 14
        : Math.max(6, selectedPoint.y - 84)
      : 6;
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${series.map((line) => `${line.name} ${total(line)}`).join(", ")} in the selected period.`}
    >
      <Card style={s.chart}>
        <Text accessibilityRole="header" style={s.chartTitle}>
          {title}
        </Text>
        {note && <Text style={s.note}>{note}</Text>}
        <View style={s.legend}>
          {series.map((line, i) => (
            <View key={line.name} style={s.legendItem}>
              <View style={[s.swatch, { backgroundColor: palette[i] }]} />
              <Text style={s.legendText}>{line.name.replaceAll("_", " ")}</Text>
            </View>
          ))}
        </View>
        <View
          onLayout={(e) =>
            setSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
          onTouchStart={(e) => selectX(e.nativeEvent.locationX)}
          onTouchMove={(e) => selectX(e.nativeEvent.locationX)}
          style={s.plot}
        >
          {[0.25, 0.5, 0.75].map((y) => (
            <View
              key={y}
              pointerEvents="none"
              style={[s.grid, { bottom: pad + y * h }]}
            />
          ))}
          {selectedPoint && (
            <View
              pointerEvents="none"
              style={[s.crosshair, { left: selectedPoint.x }]}
            />
          )}
          {series.map((line, si) =>
            line.points.slice(1).map((to, i) => {
              const from = line.points[i];
              if (from.count === null || to.count === null) return null;
              const a = position(from, i, line.points.length),
                b = position(to, i + 1, line.points.length),
                dx = b.x - a.x,
                dy = b.y - a.y;
              return (
                <View
                  key={`${line.name}-${to.key}`}
                  pointerEvents="none"
                  style={[
                    s.segment,
                    {
                      left: a.x,
                      bottom: a.y,
                      width: Math.sqrt(dx * dx + dy * dy),
                      backgroundColor: palette[si],
                      transform: [{ rotate: `${-Math.atan2(dy, dx)}rad` }],
                    },
                  ]}
                />
              );
            }),
          )}
          {series.map((line, si) =>
            line.points.map((p, i) =>
              p.count === null ? null : (
                <View
                  key={`${line.name}${p.key}`}
                  pointerEvents="none"
                  style={[
                    s.dot,
                    {
                      left: position(p, i, line.points.length).x,
                      bottom: position(p, i, line.points.length).y,
                      backgroundColor: palette[si],
                    },
                    p.key === detailKey && s.selectedDot,
                  ]}
                />
              ),
            ),
          )}
          {detailKey && (
            <View
              pointerEvents="none"
              accessibilityLabel={`${short(detailKey)}. ${series.map((line) => `${line.name}: ${line.points[selectedIndex]?.count ?? "No data"}`).join(", ")}`}
              style={[s.tooltip, { left: tooltipLeft, bottom: tooltipBottom }]}
            >
              <Text style={s.tooltipTitle}>{short(detailKey)}</Text>
              {series.map((line) => (
                <Text key={line.name} style={s.tooltipText}>
                  {line.name.replaceAll("_", " ")}:{" "}
                  {line.points[selectedIndex]?.count ?? "No data"}
                </Text>
              ))}
            </View>
          )}
        </View>
        <View style={s.xAxis}>
          {periods.map((p, i) => (
            <Text
              key={p.key}
              numberOfLines={1}
              style={[
                s.axis,
                { width: `${100 / Math.max(1, periods.length)}%` },
              ]}
            >
              {i === 0 || i === periods.length - 1 || periods.length <= 6
                ? short(p.key)
                : ""}
            </Text>
          ))}
        </View>
        <Text accessibilityRole="summary" style={s.compact}>
          {series
            .map(
              (line) =>
                `${total(line)} ${line.name.replaceAll("_", " ").toLowerCase()}`,
            )
            .join(" · ")}
        </Text>
        {periods.length > 1 && (
          <View style={s.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous period"
              disabled={selectedIndex === 0}
              onPress={() => setSelected(periods[selectedIndex - 1].key)}
            >
              <Text style={[s.control, selectedIndex === 0 && s.disabled]}>
                Previous
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next period"
              disabled={selectedIndex === periods.length - 1}
              onPress={() => setSelected(periods[selectedIndex + 1].key)}
            >
              <Text
                style={[
                  s.control,
                  selectedIndex === periods.length - 1 && s.disabled,
                ]}
              >
                Next
              </Text>
            </Pressable>
          </View>
        )}
      </Card>
    </View>
  );
}
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
      <View style={s.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text>Loading analytics…</Text>
      </View>
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
