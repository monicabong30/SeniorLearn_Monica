import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "./ui";
import { ScaledText as Text } from "./ScaledText";
import { colors, space, type } from "../theme/tokens";

export function RecurringClassCard({ items, enrollments=[] }: {items:any[]; enrollments?:any[]}) {
  const router=useRouter(), rows=[...items].sort((a,b)=>+new Date(a.startsAt)-+new Date(b.startsAt)), first=rows[0], last=rows[rows.length-1];
  const active=enrollments.filter((x:any)=>x.status==='ACTIVE'&&rows.some(row=>row._id===x.class?._id)).length;
  return <Card><Text style={s.title}>{first.title}</Text><Text style={s.recurring}>↻ Recurring class</Text><Text style={s.meta}>{new Date(first.startsAt).toLocaleDateString('en-AU')} – {new Date(last.startsAt).toLocaleDateString('en-AU')}</Text><Text style={s.meta}>{rows.length} classes{active?` · ${active} of ${rows.length} enrolled`:''}</Text><Pressable accessibilityRole="button" accessibilityLabel={`View classes for ${first.title}`} onPress={()=>router.push({pathname:'/recurring/[seriesId]',params:{seriesId:first.recurrenceSeriesId}})} style={s.action}><Text style={s.actionText}>View Classes</Text></Pressable></Card>;
}
const s=StyleSheet.create({title:{...type.section,color:colors.text},recurring:{color:colors.primary,fontWeight:'700'},meta:{...type.secondary,color:colors.textSecondary},action:{alignSelf:'flex-start',minHeight:44,justifyContent:'center'},actionText:{color:colors.primary,fontWeight:'700'}});
