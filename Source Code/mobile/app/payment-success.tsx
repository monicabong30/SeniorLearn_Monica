import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScaledText as Text } from '../src/components/ScaledText';
import { AppButton, Card, PageTitle } from '../src/components/ui';
import { useAuth } from '../src/context/Auth';
import { colors, space, type } from '../src/theme/tokens';

export default function PaymentSuccess() {
  const { refreshUser, membership } = useAuth(), router = useRouter(), { kind, returnTo } = useLocalSearchParams<{kind?:string;returnTo?:string}>(), refreshed = useRef(false);
  const [refreshing, setRefreshing] = useState(false), [confirmed,setConfirmed]=useState(false);
  const refresh = useCallback(async () => { setRefreshing(true); try { for(let attempt=0;attempt<3;attempt++){ try { await refreshUser(); setConfirmed(true); return; } catch { if(attempt<2) await new Promise(resolve=>setTimeout(resolve,400*(attempt+1))); } } } finally { setRefreshing(false); } }, [refreshUser]);
  useFocusEffect(useCallback(() => { if (refreshed.current) return; refreshed.current = true; void refresh(); }, [refresh]));
  const activation = kind === 'REGISTRATION';
  return <ScrollView contentContainerStyle={s.page}><PageTitle title="Payment approved" subtitle="Your DemoPay payment was completed." /><Card style={s.successCard}><View style={s.icon}><Ionicons name="checkmark" size={44} color="#fff" /></View><Text style={s.heading}>{activation ? "Membership activated" : "Membership renewed"}</Text><Text style={s.message}>{confirmed?(activation?'Your membership is now active and you can enrol in classes.':'Your membership has been renewed successfully.'):'Confirming your membership status…'}</Text>{membership?.startsAt&&<Text style={s.note}>Starts: {new Date(membership.startsAt).toLocaleDateString('en-AU')}</Text>}{membership?.expiresAt&&<Text style={s.note}>Expires: {new Date(membership.expiresAt).toLocaleDateString('en-AU')}</Text>}<AppButton label="Continue" loading={refreshing} disabled={!confirmed} onPress={() => router.replace((returnTo || '/(tabs)') as any)} /></Card></ScrollView>;
}
const s=StyleSheet.create({page:{flexGrow:1,padding:space.lg,gap:space.lg,backgroundColor:colors.background},successCard:{alignItems:'center',gap:space.md,paddingVertical:space.xxxl},icon:{width:76,height:76,borderRadius:38,alignItems:'center',justifyContent:'center',backgroundColor:colors.success},heading:{...type.section,color:colors.success},message:{...type.body,color:colors.text,textAlign:'center'},note:{...type.secondary,color:colors.textSecondary,textAlign:'center'}});
