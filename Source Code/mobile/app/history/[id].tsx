import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { api } from "../../src/lib/api";
import { Card, PageTitle, StatusBadge } from "../../src/components/ui";
import { ScaledText as Text } from "../../src/components/ScaledText";
import { classSchedule } from "../../src/lib/classFormat";
import { colors, space } from "../../src/theme/tokens";

export default function HistoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [row, setRow] = useState<any>();
  useFocusEffect(useCallback(() => { void api.get("/enrollments").then(r => setRow(r.data.find((item: any) => item._id === id))); }, [id]));
  if (!row) return <ScrollView contentContainerStyle={s.page}><PageTitle title="Learning History" subtitle="History record unavailable." /></ScrollView>;
  const c = row.class;
  return <ScrollView contentContainerStyle={s.page}><PageTitle title="Learning History" subtitle={c?.title || "Class no longer available"}/><Card><StatusBadge status={row.status === "CANCELLED" ? "Enrollment Cancelled" : c?.status === "CANCELLED" ? "Class Cancelled" : "Scheduled"}/><Text>{c ? classSchedule(c.startsAt) : "Class schedule unavailable"}</Text>{c?.tutor?.name && <Text>Tutor: {c.tutor.name}</Text>}<Text>Enrolled: {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-AU") : "Date unavailable"}</Text>{row.status === "CANCELLED" && row.updatedAt && <Text>Enrollment cancelled: {new Date(row.updatedAt).toLocaleDateString("en-AU")}</Text>}{c?.status === "CANCELLED" && <Text>The tutor cancelled this class.</Text>}</Card><Card><Text style={s.heading}>Timeline</Text>{row.createdAt && <Text>Enrolled — {new Date(row.createdAt).toLocaleDateString("en-AU")}</Text>}{row.status === "CANCELLED" && row.updatedAt && <Text>Enrollment Cancelled — {new Date(row.updatedAt).toLocaleDateString("en-AU")}</Text>}{c?.startsAt && <Text>Scheduled Class Date — {new Date(c.startsAt).toLocaleDateString("en-AU")}</Text>}</Card></ScrollView>;
}
const s=StyleSheet.create({page:{padding:space.lg,gap:space.lg,backgroundColor:colors.background},heading:{color:colors.primary,fontWeight:"700"}});
