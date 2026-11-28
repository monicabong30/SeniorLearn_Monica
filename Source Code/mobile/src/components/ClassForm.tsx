import { Pressable, StyleSheet, View } from "react-native";
import { ScaledText as Text } from "./ScaledText";
import { Card, Field } from "./ui";
import { DatePickerField } from "./DatePickerField";
import { TimePickerField } from "./TimePickerField";
import { NumberInputField } from "./NumberInputField";
import { localDateOnly } from "../lib/registration";
import { ClassFormValues, durationBetween, durationLabel, MINIMUM_CLASS_CAPACITY } from "../lib/scheduling";
import { colors, space } from "../theme/tokens";

type Props={values:ClassFormValues;errors:Record<string,string>;onChange:(key:keyof ClassFormValues,value:string)=>void};

/** Shared class-editing fields. Screens retain ownership of save, permissions and navigation. */
export function ClassForm({values,errors,onChange}:Props){
  const duration=durationBetween(values.startTime,values.endTime);
  const delivery=values.delivery||'ONLINE';
  return <Card>
    <Field label="Class title" placeholder="e.g. Introduction to Digital Photography" value={values.title} error={errors.title} onChangeText={v=>onChange('title',v)}/>
    <Field label="Description" placeholder="e.g. Learn basic photography skills" value={values.description} error={errors.description} onChangeText={v=>onChange('description',v)} multiline/>
    <DatePickerField label="Class date" placeholder="DD/MM/YYYY" minimumDate={localDateOnly()} value={values.date} error={errors.date} onChange={v=>onChange('date',v)}/>
    <View style={s.times}><View style={s.timeField}><TimePickerField label="Start time" placeholder="Select start time" value={values.startTime} error={errors.startTime} onChange={v=>onChange('startTime',v)}/></View><View style={s.timeField}><TimePickerField label="End time" placeholder="Select end time" value={values.endTime} error={errors.endTime||(duration<=0?'End time must be later than start time.':undefined)} onChange={v=>onChange('endTime',v)}/></View></View>
    <Text style={s.duration}>Duration — {duration>0?durationLabel(duration):'Select a valid time range'}</Text>
    <NumberInputField label="Capacity" placeholder="e.g. 20" minimum={MINIMUM_CLASS_CAPACITY} required error={errors.capacity} value={String(values.capacity||'')} onChangeText={v=>onChange('capacity',v)}/>
    <View style={s.delivery}><Text style={s.label}>Class delivery type</Text><View style={s.deliveryChoices}>{(['ONLINE','ON_PREMISES'] as const).map(option=><Pressable key={option} accessibilityRole="radio" accessibilityState={{checked:delivery===option}} onPress={()=>onChange('delivery',option)} style={[s.choice,delivery===option&&s.choiceSelected]}><Text style={[s.choiceText,delivery===option&&s.choiceTextSelected]}>{option==='ONLINE'?'Online (Microsoft Teams)':'In person'}</Text></Pressable>)}</View></View>
    {delivery==='ONLINE'
      ? <Field label="Microsoft Teams link" placeholder="https://teams.microsoft.com/..." error={errors.teamsLink} value={values.teamsLink||''} autoCapitalize="none" onChangeText={v=>onChange('teamsLink',v)}/>
      : <Field label="Venue address" placeholder="e.g. 25 George Street" error={errors.address} value={values.address||''} onChangeText={v=>onChange('address',v)}/>
    }
  </Card>;
}
const s=StyleSheet.create({duration:{color:colors.primary,fontWeight:'700'},times:{flexDirection:'row',gap:space.md,flexWrap:'wrap'},timeField:{flexGrow:1,flexBasis:220},delivery:{gap:space.xs},label:{fontWeight:'600',color:colors.text},deliveryChoices:{flexDirection:'row',gap:space.sm,flexWrap:'wrap'},choice:{minHeight:48,justifyContent:'center',paddingHorizontal:space.md,borderWidth:1.5,borderRadius:12,borderColor:colors.border,backgroundColor:colors.surface},choiceSelected:{borderColor:colors.primary,backgroundColor:'#e7f0f7'},choiceText:{color:colors.text},choiceTextSelected:{color:colors.primary,fontWeight:'700'}});
