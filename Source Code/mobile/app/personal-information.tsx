import { ScaledText as Text } from "../src/components/ScaledText";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DatePickerField } from "../src/components/DatePickerField";
import { AppButton, Card, Field, PageTitle } from "../src/components/ui";
import { useAuth } from "../src/context/Auth";
import { useFeedback } from "../src/context/Feedback";
import { api, errorMessage } from "../src/lib/api";
import { colors, space, type } from "../src/theme/tokens";
import { useFormSubmitState } from "../src/hooks/useFormSubmitState";
import { rolesOf } from '../src/lib/permissions';
type Values={name:string;phone:string;dob:string};
export default function PersonalInformation() {
 const { user, refreshUser }=useAuth(),router=useRouter(),{show}=useFeedback(),[values,setValues]=useState<Values>({name:"",phone:"",dob:""}),[initial,setInitial]=useState<Values>(),[membership,setMembership]=useState<any>(),[busy,setBusy]=useState(false);
 useEffect(()=>{void api.get("/me").then(r=>{const next={name:r.data.user.name||"",phone:r.data.user.phone||"",dob:r.data.user.dateOfBirth?String(r.data.user.dateOfBirth).slice(0,10):""};setValues(next);setInitial(next);setMembership(r.data.membership);});},[]);
 const validate=useCallback((v:Values)=>({...(v.name.trim().length<2?{name:"Enter your full name."}:{}),...(v.phone.trim().length<6?{phone:"Enter a valid phone number."}:{}),...(v.dob&&!/^\d{4}-\d{2}-\d{2}$/.test(v.dob)?{dob:"Choose a valid date of birth."}:{})}),[]);
 const form=useFormSubmitState({initialValues:initial||values,values,validate,isSubmitting:busy,mode:"edit",normalize:v=>({name:v.name.trim(),phone:v.phone.trim(),dob:v.dob})});
 const save=async()=>{if(!form.canSubmit)return;try{setBusy(true);const next={name:values.name.trim(),phone:values.phone.trim(),dob:values.dob};await api.put("/me",{name:next.name,phone:next.phone,dateOfBirth:next.dob||undefined});await refreshUser();setInitial(next);show("SUCCESS","Your personal information has been saved.");router.replace("/(tabs)/profile")}catch(e){show("ERROR",errorMessage(e));}finally{setBusy(false)}};
 return <ScrollView contentContainerStyle={s.page}><PageTitle title="Personal information" subtitle="Keep your contact details up to date."/><Card style={s.card}><Field label="Full name" value={values.name} error={form.errors.name} onChangeText={name=>setValues(v=>({...v,name}))}/><Field label="Email address" value={user?.email} editable={false}/><Field label="Phone number" value={values.phone} error={form.errors.phone} keyboardType="phone-pad" onChangeText={phone=>setValues(v=>({...v,phone}))}/><DatePickerField label="Date of birth" value={values.dob} maximumDate={new Date().toISOString().slice(0,10)} onChange={dob=>setValues(v=>({...v,dob}))} error={form.errors.dob}/></Card><Card style={s.card}><Text style={s.section}>Membership</Text><Text>Membership roles: {rolesOf(user).join(", ")}</Text><Text>Membership expiry: {membership?.expiresAt?new Date(membership.expiresAt).toLocaleDateString():"Not available"}</Text></Card>{!form.isDirty&&!busy&&<Text style={s.helper}>Make a change to enable Save changes.</Text>}<AppButton label="Save changes" onPress={save} loading={busy} disabled={!form.canSubmit}/></ScrollView>;
}
const s=StyleSheet.create({page:{flexGrow:1,width:"100%",maxWidth:680,alignSelf:"center",padding:space.lg,gap:space.lg,backgroundColor:colors.background},card:{gap:space.md},section:{...type.section,color:colors.text},helper:{...type.secondary,color:colors.textSecondary}});
