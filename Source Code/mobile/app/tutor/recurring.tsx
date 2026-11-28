import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import { Card, PageTitle } from "../../src/components/ui";
import { LoadingIndicator } from "../../src/components/LoadingIndicator";
import { ScaledText as Text } from "../../src/components/ScaledText";
import { colors, space, type } from "../../src/theme/tokens";
import { useFeedback } from "../../src/context/Feedback";

const frequency = (rows: any[]) => rows.length > 1 && Math.round((+new Date(rows[1].startsAt) - +new Date(rows[0].startsAt)) / 86400000) === 14 ? "Every 2 weeks" : "Weekly";
const time = (row: any) => { const start = new Date(row.startsAt), end = new Date(+start + row.durationMinutes * 60000); return `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`; };

export default function RecurringClasses() {
  const router = useRouter(), { show } = useFeedback();
  const [rows, setRows] = useState<any[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const load = async () => { try { setError(""); const { data } = await api.get("/classes", { params: { mine: "true" } }); setRows(Array.isArray(data) ? data.filter((x: any) => x.recurrenceSeriesId) : []); } catch { setError("Unable to load recurring classes."); show("ERROR", "Unable to load recurring classes."); } finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { void load(); }, []));
  const series = Object.values(rows.reduce<Record<string, any[]>>((all, row) => { (all[row.recurrenceSeriesId] ||= []).push(row); return all; }, {})).map(items => items.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)));
  return <ScrollView contentContainerStyle={s.page}><PageTitle title="Recurring classes" />
    {loading ? <LoadingIndicator accessibilityLabel="Loading recurring classes" /> : error ? <View style={s.state}><Text accessibilityRole="alert">{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()}><Text style={s.retry}>Try again</Text></Pressable></View> : series.length ? series.map(items => { const first = items[0], last = items[items.length - 1]; return <Pressable key={first.recurrenceSeriesId} accessibilityRole="button" accessibilityLabel={`Manage ${first.title} recurring classes`} onPress={() => router.push({ pathname: "/tutor/recurring/[seriesId]", params: { seriesId: first.recurrenceSeriesId } })}><Card style={s.card}><View style={s.row}><View style={s.content}><Text style={s.title}>{first.title}</Text><Text style={s.meta}>{frequency(items)} · {time(first)}</Text><Text style={s.meta}>{new Date(first.startsAt).toLocaleDateString("en-AU")} – {new Date(last.startsAt).toLocaleDateString("en-AU")}</Text><Text style={s.meta}>{items.length} scheduled class{items.length === 1 ? "" : "es"}</Text></View><Ionicons name="chevron-forward" size={24} color={colors.primary} /></View><Text style={s.action}>Manage Classes</Text></Card></Pressable>; }) : <Text style={s.empty}>No recurring classes yet.</Text>}
  </ScrollView>;
}
const s = StyleSheet.create({ page: { padding: space.lg, gap: space.md, backgroundColor: colors.background, flexGrow: 1 }, card: { gap: space.sm }, row: { flexDirection: "row", alignItems: "center", gap: space.sm }, content: { flex: 1, gap: 3 }, title: { ...type.section, color: colors.primary }, meta: { ...type.secondary, color: colors.textSecondary }, action: { color: colors.primary, fontWeight: "700" }, empty: { textAlign: "center", padding: space.xxl, color: colors.textSecondary }, state: { alignItems: "center", gap: space.sm, padding: space.xxl }, retry: { color: colors.primary, fontWeight: "700", padding: space.sm } });
