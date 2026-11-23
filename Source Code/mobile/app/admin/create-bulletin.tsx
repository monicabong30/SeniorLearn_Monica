import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { api } from "../../src/lib/api";
import { AppButton, Card, Field, PageTitle } from "../../src/components/ui";
import { useFeedback } from "../../src/context/Feedback";
import { useFormSubmitState } from "../../src/hooks/useFormSubmitState";
import { colors, space } from "../../src/theme/tokens";

type Values={title:string;body:string};
export default function CreateBulletin(){
 const {id}=useLocalSearchParams<{id:string}>(),router=useRouter(),{show}=useFeedback(),[values,setValues]=useState<Values>({title:"",body:""}),[initial,setInitial]=useState<Values>(),[pending,setPending]=useState(false),[requestError,setRequestError]=useState("");
 useEffect(()=>{if(id)void api.get(`/bulletins/${id}`).then(r=>{const next={title:r.data.title,body:r.data.body};setInitial(next);setValues(next);}).catch(()=>setRequestError("Unable to load bulletin."));},[id]);
 const validate=useCallback((v:Values)=>({...(v.title.trim().length<3?{title:"Title must be at least 3 characters."}:{}),...(v.body.trim().length<10?{body:"Message must be at least 10 characters."}:{})}),[]);
 const form=useFormSubmitState({initialValues:initial||{title:"",body:""},values,validate,isSubmitting:pending,mode:id?"edit":"create",normalize:v=>({title:v.title.trim(),body:v.body.trim()})});
 const save=async()=>{if(!form.canSubmit)return;setPending(true);setRequestError("");try{const next={title:values.title.trim(),body:values.body.trim()};await(id?api.put(`/bulletins/${id}`,next):api.post("/bulletins",next));setInitial(next);show("SUCCESS",id?"Bulletin updated successfully.":"Draft created successfully.");router.replace("/admin/bulletins")}catch{setRequestError("Unable to save bulletin. Please try again.")}finally{setPending(false)}};
 return <ScrollView contentContainerStyle={s.page}><PageTitle title={id?"Edit Bulletin":"Create Bulletin"} subtitle="Save a draft for member communications."/><Card style={s.card}><Field label="Bulletin Title" value={values.title} onChangeText={title=>setValues(v=>({...v,title}))} error={form.errors.title}/><Field label="Bulletin Message" value={values.body} onChangeText={body=>setValues(v=>({...v,body}))} error={form.errors.body} multiline/>{requestError ? <Text style={s.error}>{requestError}</Text> : null}{id&&!form.isDirty&&!pending&&<Text style={s.helper}>Make a change to enable Save Changes.</Text>}<AppButton label={id?"Save Changes":"Save Draft"} loading={pending} disabled={!form.canSubmit} onPress={()=>void save()}/></Card></ScrollView>;
}
const s=StyleSheet.create({page:{padding:space.lg,gap:space.lg,backgroundColor:colors.background},card:{gap:space.md},helper:{color:colors.textSecondary},error:{color:colors.error}});
