import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../src/lib/api";
import { AppButton, Card, PageTitle, StatusBadge } from "../../../src/components/ui";
import { LoadingIndicator } from "../../../src/components/LoadingIndicator";
import { ScaledText as Text } from "../../../src/components/ScaledText";
import { colors, space, type } from "../../../src/theme/tokens";
import { useFeedback } from "../../../src/context/Feedback";
import { useAuth } from "../../../src/context/Auth";
import { canAdmin } from "../../../src/lib/permissions";

export default function RecurringSeries() {
  const { seriesId } = useLocalSearchParams<{ seriesId: string }>(), router = useRouter(), { show } = useFeedback(), { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]), [series, setSeries] = useState<any>(), [loading, setLoading] = useState(true), [error, setError] = useState(""), [publishing,setPublishing]=useState(false);
  const load = async () => { try { setError(""); const {data}=await api.get(`/recurrences/${seriesId}`); setSeries(data); setRows(data.occurrences || []); } catch { setError("Unable to load this recurring series."); show("ERROR", "Unable to load this recurring series."); } finally { setLoading(false); } };
  useFocusEffect(useCallback(() => { void load(); }, [seriesId, user]));
  if (loading) return <LoadingIndicator variant="fill" accessibilityLabel="Loading recurring series" />;
  if (error) return <View style={s.state}><Text accessibilityRole="alert">{error}</Text><Pressable onPress={() => void load()}><Text style={s.link}>Try again</Text></Pressable></View>;
  const first = rows[0], last = rows[rows.length - 1];
  if (!first) return <View style={s.state}><Text>This recurring series is no longer available.</Text></View>;
  const gap = rows.length > 1 ? Math.round((+new Date(rows[1].startsAt) - +new Date(first.startsAt)) / 86400000) : 7;
  const publish=async()=>{try{setPublishing(true);await api.post(`/recurrences/${seriesId}/publish`);await load();show("SUCCESS","All classes in this series are now published.");}catch(e:any){show("ERROR",e?.response?.data?.error||"Unable to publish this series.");}finally{setPublishing(false);}};
  return <ScrollView contentContainerStyle={s.page}><PageTitle title={first.title} />
    <Card><Text style={s.summary}>↻ Recurring class</Text><StatusBadge status={series?.status||"DRAFT"}/><Text>{gap === 14 ? "Every 2 weeks" : "Weekly"}</Text><Text>{new Date(first.startsAt).toLocaleDateString("en-AU")} – {new Date(last.startsAt).toLocaleDateString("en-AU")}</Text><Text>{rows.length} class{rows.length === 1 ? "" : "es"}</Text>{series?.status==="DRAFT"?<AppButton label="Publish All Classes" loading={publishing} disabled={publishing} onPress={()=>void publish()}/>:null}</Card>
    <Text style={s.heading}>Classes</Text>{rows.map((item, index) => { const start = new Date(item.startsAt), end = new Date(+start + item.durationMinutes * 60000), exceptional=["COMPLETE","CLOSED","CANCELLED"].includes(item.status); return <Pressable key={item._id} accessibilityRole="link" onPress={() => router.push(`/class/${item._id}`)}><Card style={s.item}><View style={s.itemText}><Text style={s.className}>Class {index + 1}</Text><Text>{start.toLocaleDateString("en-AU")} · {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text><Text style={s.meta}>{item.enrollmentCount || 0} / {item.capacity} members enrolled</Text>{exceptional?<StatusBadge status={item.status}/>:null}</View><Ionicons name="chevron-forward" size={24} color={colors.primary} /></Card></Pressable>; })}</ScrollView>;
}
const s = StyleSheet.create({ page: { padding: space.lg, gap: space.md, backgroundColor: colors.background }, state: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.sm, padding: space.lg }, summary: { ...type.section, color: colors.primary }, heading: { ...type.section, color: colors.primary, marginTop: space.sm }, item: { flexDirection: "row", alignItems: "center", gap: space.sm }, itemText: { flex: 1, gap: space.xs }, className: { fontWeight: "700", color: colors.primary }, meta: { color: colors.textSecondary }, link: { color: colors.primary, fontWeight: "700", padding: space.sm } });
