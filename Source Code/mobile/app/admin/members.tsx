import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../src/lib/api";
import { AppButton, Card, Field, PageTitle, StatusBadge } from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { hasRole } from '../../src/lib/permissions';
import { DateFilterSection, type DateFilterValue } from "../../src/components/DateFilterSection";

const filters=["ALL","STANDARD","PROFESSIONAL","HONORARY","ACTIVE","PENDING","EXPIRED"];
export default function Members() { const router=useRouter(), [items,setItems]=useState<any[]>([]),[search,setSearch]=useState(""),[filter,setFilter]=useState("ALL"),[dates,setDates]=useState<DateFilterValue>({type:"Registration Date",startDate:"",endDate:""});
 const validDates=!dates.startDate||!dates.endDate||dates.startDate<=dates.endDate;
 const load=async()=>setItems((await api.get("/admin/members",{params:{search,...(validDates&&{dateType:dates.type,startDate:dates.startDate||undefined,endDate:dates.endDate||undefined})}})).data);
 useFocusEffect(useCallback(()=>{void load().catch(()=>setItems([]));},[search,dates,validDates]));
 const filtered=items.filter(member=>filter==="ALL"||(['STANDARD','PROFESSIONAL','HONORARY'].includes(filter)&&hasRole(member,filter as any))||member.membership?.status===filter);
 return <><ScrollView contentContainerStyle={s.page}><PageTitle title="Manage Members" subtitle="Review member roles and membership information." /><Field label="Search members" placeholder="Name or email" value={search} onChangeText={setSearch}/>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{filters.map(value=><Pressable key={value} accessibilityRole="button" onPress={()=>setFilter(value)} style={[s.filter,filter===value&&s.selected]}><Text style={filter===value?s.selectedText:undefined}>{value[0]+value.slice(1).toLowerCase()}</Text></Pressable>)}</ScrollView>
 <DateFilterSection types={["Registration Date","Membership Renewal Date"]} value={dates} onChange={setDates}/>
 {filtered.map(member=><Card key={member.id} style={s.card}><Text style={s.name}>{member.name}</Text><Text>{member.email}</Text><View style={s.badges}>{(member.roles||[]).map((role:string)=><StatusBadge key={role} status={role}/>)}{member.isAdmin&&<StatusBadge status="ADMIN"/>}<StatusBadge status={member.membership?.status||"NO MEMBERSHIP"}/></View><Text style={s.meta}>Renewal: {member.membership?.expiresAt?new Date(member.membership.expiresAt).toLocaleDateString("en-AU"):"Not available"}</Text><Pressable accessibilityRole="link" onPress={()=>router.push({pathname:"/admin/member",params:{id:member.id}})}><Text style={s.link}>View Details →</Text></Pressable></Card>)}
 {filtered.length===0&&<Text>No members match your filters.</Text>}</ScrollView></> }
const s=StyleSheet.create({page:{padding:space.lg,gap:space.md,backgroundColor:colors.background},filters:{gap:space.xs,paddingRight:space.lg},filter:{minHeight:42,paddingHorizontal:space.md,justifyContent:"center",borderWidth:1,borderRadius:21,borderColor:colors.border},selected:{backgroundColor:colors.primary,borderColor:colors.primary},selectedText:{color:"#fff",fontWeight:"700"},card:{gap:space.xs},name:{...type.section,color:colors.primary},badges:{flexDirection:"row",gap:space.xs,flexWrap:"wrap"},meta:{color:colors.textSecondary},link:{color:colors.primary,fontWeight:"700",paddingVertical:space.xs}});
