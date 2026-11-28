import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "./ui";
import { ScaledText as Text } from "./ScaledText";
import { colors, space, type } from "../theme/tokens";

export type AnalyticsPoint = { key: string; count: number | null };
export type AnalyticsSeries = { name: string; points: AnalyticsPoint[] };

const palette = [colors.primary, "#007C91", "#8055A5", "#BD6A30", "#4E7B46"];
const pad = 6;
const dateLabel = (key: string) => new Date(`${key}${key.length === 7 ? "-01" : ""}T00:00:00Z`).toLocaleDateString("en-AU", { day: key.length === 10 ? "numeric" : undefined, month: "short", timeZone: "UTC" });

/** Shared direct-manipulation chart used by every time-series dashboard card. */
export function InteractiveLineChart({ title, series, note }: { title: string; series: AnalyticsSeries[]; note?: string }) {
  const [size, setSize] = useState({ width: 0, height: 145 });
  const [selected, setSelected] = useState<string>();
  const gesture = useRef<{ x: number; y: number; horizontal?: boolean; pointerId?: number } | undefined>(undefined);
  const periods = series[0]?.points || [];
  const values = series.flatMap((line) => line.points).filter((point): point is { key: string; count: number } => point.count !== null);
  const max = Math.max(1, ...values.map((point) => point.count));
  const width = Math.max(1, size.width - pad * 2), height = Math.max(1, size.height - pad * 2);
  const selectedIndex = Math.max(0, periods.findIndex((point) => point.key === selected));
  const selectedKey = periods[selectedIndex]?.key;
  const pointPosition = (point: AnalyticsPoint, index: number, length: number) => ({ x: pad + (length < 2 ? width / 2 : index / (length - 1) * width), y: pad + (point.count || 0) / max * height });
  const selectX = (x: number) => {
    if (!periods.length) return;
    // React Native Web does not provide locationX for every synthetic mouse
    // event. Fall back to the first point rather than allowing NaN to index
    // the periods array and crashing the dashboard.
    const chartX = Number.isFinite(x) ? x : pad;
    const index = periods.length === 1 ? 0 : Math.max(0, Math.min(periods.length - 1, Math.round((chartX - pad) / width * (periods.length - 1))));
    const point = periods[index];
    if (point && point.key !== selected) setSelected(point.key);
  };
  // Pointer events are needed for mouse dragging on React Native Web. Unlike
  // locationX, clientX is consistently supplied by desktop mouse events.
  const pointerX = (event: any) => {
    const native = event.nativeEvent || event;
    if (Number.isFinite(native.locationX)) return native.locationX;
    if (Number.isFinite(native.offsetX)) return native.offsetX;
    const rect = event.currentTarget?.getBoundingClientRect?.();
    return rect && Number.isFinite(native.clientX) ? native.clientX - rect.left : Number.NaN;
  };
  const beginPointer = (event: any) => {
    const native = event.nativeEvent || event;
    gesture.current = { x: native.clientX ?? native.pageX ?? 0, y: native.clientY ?? native.pageY ?? 0, pointerId: native.pointerId };
    event.currentTarget?.setPointerCapture?.(native.pointerId);
    selectX(pointerX(event));
  };
  const dragPointer = (event: any) => {
    const native = event.nativeEvent || event, start = gesture.current;
    if (!start || (start.pointerId !== undefined && native.pointerId !== start.pointerId)) return;
    const x = native.clientX ?? native.pageX ?? start.x, y = native.clientY ?? native.pageY ?? start.y;
    if (start.horizontal === undefined && (Math.abs(x - start.x) > 4 || Math.abs(y - start.y) > 4)) start.horizontal = Math.abs(x - start.x) > Math.abs(y - start.y);
    if (start.horizontal) selectX(pointerX(event));
  };
  const endPointer = (event: any) => { const native = event.nativeEvent || event; event.currentTarget?.releasePointerCapture?.(native.pointerId); gesture.current = undefined; };
  const move = (direction: number) => { const point = periods[Math.max(0, Math.min(periods.length - 1, selectedIndex + direction))]; if (point) setSelected(point.key); };
  const selectedPosition = selectedKey ? pointPosition(periods[selectedIndex], selectedIndex, periods.length) : undefined;
  const tooltipLeft = selectedPosition ? Math.max(4, Math.min(Math.max(4, size.width - 194), selectedPosition.x - 95)) : 4;
  const tooltipBottom = selectedPosition ? selectedPosition.y < height - 92 ? selectedPosition.y + 14 : Math.max(6, selectedPosition.y - 84) : 6;
  const capacity = Math.max(2, Math.floor(size.width / 58));
  const labelStep = Math.max(1, Math.ceil((periods.length - 1) / (capacity - 1)));
  const total = (line: AnalyticsSeries) => line.points.reduce((sum, point) => sum + (point.count || 0), 0);
  return <View accessible accessibilityLabel={`${title}. ${series.map((line) => `${line.name} ${total(line)}`).join(", ")} in the selected period.`}>
    <Card style={s.chart}>
      <Text accessibilityRole="header" style={s.chartTitle}>{title}</Text>
      {note ? <Text style={s.note}>{note}</Text> : null}
      <View style={s.legend}>{series.map((line, index) => <View key={line.name} style={s.legendItem}><View style={[s.swatch, { backgroundColor: palette[index % palette.length] }]} /><Text style={s.legendText}>{line.name.replaceAll("_", " ")}</Text></View>)}</View>
      <Pressable accessible accessibilityRole="adjustable" accessibilityLabel={`${title} chart${selectedKey ? `. Selected ${dateLabel(selectedKey)}` : ""}`} accessibilityHint="Tap or drag horizontally to select a date. Use left and right arrow keys when focused." onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })} onPress={(event) => selectX(pointerX(event))} onPointerDown={beginPointer as any} onPointerMove={dragPointer as any} onPointerUp={endPointer as any} onPointerCancel={endPointer as any} onTouchStart={(event) => { const touch = event.nativeEvent.touches[0]; gesture.current = { x: touch?.pageX ?? event.nativeEvent.pageX, y: touch?.pageY ?? event.nativeEvent.pageY }; selectX(event.nativeEvent.locationX); }} onTouchMove={(event) => { const touch = event.nativeEvent.touches[0]; const x = touch?.pageX ?? event.nativeEvent.pageX, y = touch?.pageY ?? event.nativeEvent.pageY, start = gesture.current; if (!start) return; if (start.horizontal === undefined && (Math.abs(x - start.x) > 4 || Math.abs(y - start.y) > 4)) start.horizontal = Math.abs(x - start.x) > Math.abs(y - start.y); if (start.horizontal) selectX(event.nativeEvent.locationX); }} onTouchEnd={() => { gesture.current = undefined; }} onKeyDown={(event: any) => { if (event.nativeEvent.key === "ArrowLeft") move(-1); if (event.nativeEvent.key === "ArrowRight") move(1); }} style={[s.plot, { touchAction: "pan-y" } as any]}>
        {[0.25, 0.5, 0.75].map((y) => <View key={y} pointerEvents="none" style={[s.grid, { bottom: pad + y * height }]} />)}
        {selectedPosition ? <View pointerEvents="none" style={[s.crosshair, { left: selectedPosition.x }]} /> : null}
        {series.map((line, seriesIndex) => line.points.slice(1).map((to, index) => { const from = line.points[index]; if (from.count === null || to.count === null) return null; const a = pointPosition(from, index, line.points.length), b = pointPosition(to, index + 1, line.points.length), dx = b.x - a.x, dy = b.y - a.y; return <View key={`${line.name}-${to.key}`} pointerEvents="none" style={[s.segment, { left: a.x, bottom: a.y, width: Math.sqrt(dx * dx + dy * dy), backgroundColor: palette[seriesIndex % palette.length], transform: [{ rotate: `${-Math.atan2(dy, dx)}rad` }] }]} />; }))}
        {series.map((line, seriesIndex) => line.points.map((point, index) => point.count === null ? null : <View key={`${line.name}-${point.key}`} pointerEvents="none" style={[s.dot, { left: pointPosition(point, index, line.points.length).x, bottom: pointPosition(point, index, line.points.length).y, backgroundColor: palette[seriesIndex % palette.length] }, point.key === selectedKey && s.selectedDot]} />))}
        {selectedKey ? <View pointerEvents="none" style={[s.tooltip, { left: tooltipLeft, bottom: tooltipBottom }]}><Text style={s.tooltipTitle}>{dateLabel(selectedKey)}</Text>{series.map((line, index) => <View key={line.name} style={s.tooltipRow}><View style={[s.tooltipSwatch, { backgroundColor: palette[index % palette.length] }]} /><Text style={s.tooltipText}>{line.name.replaceAll("_", " ")}: {line.points[selectedIndex]?.count ?? "No data"}</Text></View>)}</View> : null}
      </Pressable>
      <View style={s.xAxis}>{periods.map((point, index) => (index === 0 || index === periods.length - 1 || index % labelStep === 0) ? <Text key={point.key} numberOfLines={1} style={[s.axis, { left: periods.length < 2 ? "50%" : `${index / (periods.length - 1) * 100}%`, transform: [{ translateX: index === 0 ? 0 : index === periods.length - 1 ? -40 : -20 }] }]}>{dateLabel(point.key)}</Text> : null)}</View>
      <Text accessibilityRole="summary" style={s.compact}>{series.map((line) => `${total(line)} ${line.name.replaceAll("_", " ").toLowerCase()}`).join(" · ")}</Text>
    </Card>
  </View>;
}

const s = StyleSheet.create({
  chart: { gap: space.sm }, chartTitle: { ...type.section, color: colors.text }, note: { ...type.caption, color: colors.textSecondary }, legend: { flexDirection: "row", flexWrap: "wrap", gap: space.sm }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, swatch: { width: 10, height: 10, borderRadius: 5 }, legendText: { ...type.caption, color: colors.text },
  plot: { height: 145, marginHorizontal: 8, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: colors.border, position: "relative", overflow: "hidden" }, grid: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderColor: "#E8EEF4" }, crosshair: { position: "absolute", top: 0, bottom: 0, borderLeftWidth: 1, borderColor: "#7891A7", opacity: 0.8 }, segment: { position: "absolute", height: 3, borderRadius: 2, transformOrigin: "left center" as any }, dot: { position: "absolute", width: 9, height: 9, borderRadius: 5, marginLeft: -4.5, marginBottom: -4.5, borderWidth: 2, borderColor: "#fff" }, selectedDot: { width: 13, height: 13, borderRadius: 7, marginLeft: -6.5, marginBottom: -6.5, borderColor: colors.primary, borderWidth: 3 },
  tooltip: { position: "absolute", width: 190, maxWidth: "92%", padding: space.sm, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, shadowColor: "#001A33", shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }, tooltipTitle: { ...type.caption, fontWeight: "800", color: colors.primary, marginBottom: 2 }, tooltipRow: { flexDirection: "row", alignItems: "center", gap: 5 }, tooltipSwatch: { width: 7, height: 7, borderRadius: 4 }, tooltipText: { ...type.caption, color: colors.text }, xAxis: { height: 16, marginHorizontal: 8, position: "relative" }, axis: { ...type.caption, fontSize: 10, color: colors.textSecondary, position: "absolute", width: 40, textAlign: "center" }, compact: { ...type.caption, color: colors.textSecondary, fontWeight: "700" },
});
