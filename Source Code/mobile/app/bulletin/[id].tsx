import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { api } from "../../src/lib/api";
import { AppButton, Card, PageTitle } from "../../src/components/ui";
import { ConfirmationDialog } from "../../src/components/ConfirmationDialog";
import { useAuth } from "../../src/context/Auth";
import { canAdmin } from "../../src/lib/permissions";
import { colors, space, type } from "../../src/theme/tokens";
import { ScaledText as Text } from "../../src/components/ScaledText";
export default function BulletinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    router = useRouter(),
    [item, setItem] = useState<any>(),
    [menu, setMenu] = useState(false),
    [remove, setRemove] = useState(false),
    [busy, setBusy] = useState(false),
    { user } = useAuth();
  useEffect(() => {
    let active = true;
    void api
      .get(`/bulletins/${id}`)
      .then(async (r) => {
        if (!active) return;
        setItem(r.data);
        if (!r.data.readAt) await api.put(`/bulletins/${id}/read`);
      })
      .catch(() => active && setItem(null));
    return () => {
      active = false;
    };
  }, [id]);
  if (item === undefined)
    return (
      <View style={s.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (item === null)
    return (
      <View style={s.page}>
        <PageTitle title="Bulletin unavailable" />
        <AppButton label="Back to Bulletins" variant="outline" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/bulletins")} />
      </View>
    );
  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.titleRow}><View style={s.titleGrow}><PageTitle title={item.title} /></View>{canAdmin(user) && <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${item.title}`} onPress={()=>setMenu(true)} style={s.more}><Text style={s.moreText}>⋯</Text></Pressable>}</View>
      <Card>
        <Text style={s.date}>
          {item.publishedAt && new Date(item.publishedAt).toLocaleDateString()}
        </Text>
        <Text style={s.body}>{item.body}</Text>
      </Card>
      {canAdmin(user) && item.status === "DRAFT" && <AppButton
        label="Publish Bulletin"
        loading={busy}
        onPress={async()=>{try{setBusy(true);const response=await api.post(`/bulletins/${id}/publish`);setItem((current:any)=>({...current,...response.data}))}finally{setBusy(false)}}}
      />}
      <AppButton
        label="Back to Bulletins"
        variant="outline"
        onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/bulletins")}
      />
      <Modal visible={menu} transparent animationType="fade" onRequestClose={()=>setMenu(false)}><Pressable style={s.overlay} onPress={()=>setMenu(false)}><Card style={s.menu}><Text style={s.menuTitle}>{item.title}</Text><Pressable style={s.menuItem} onPress={()=>{setMenu(false);router.push({pathname:"/admin/create-bulletin",params:{id}})}}><Text>Edit Bulletin</Text></Pressable><Pressable style={s.menuItem} onPress={()=>{setMenu(false);setRemove(true)}}><Text style={s.delete}>Delete Bulletin</Text></Pressable></Card></Pressable></Modal>
      <ConfirmationDialog visible={remove} title="Delete Bulletin?" message={`Delete “${item.title}”? This cannot be undone.`} safeLabel="Keep Bulletin" destructiveLabel="Delete Bulletin" loading={busy} onDismiss={()=>setRemove(false)} onConfirm={async()=>{try{setBusy(true);await api.delete(`/bulletins/${id}`);router.replace("/admin/bulletins")}finally{setBusy(false)}}}/>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    padding: space.lg,
    gap: space.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  date: { ...type.caption, color: colors.textSecondary },
  body: { ...type.body, color: colors.text },
  titleRow:{flexDirection:"row",alignItems:"flex-start",gap:space.sm}, titleGrow:{flex:1}, more:{height:44,width:44,alignItems:"center",justifyContent:"center"}, moreText:{fontSize:26,color:colors.primary,fontWeight:"700"}, overlay:{flex:1,backgroundColor:"rgba(0,0,0,.35)",justifyContent:"center",padding:space.lg}, menu:{gap:space.xs,maxWidth:400,width:"100%",alignSelf:"center"},menuTitle:{...type.section,color:colors.primary},menuItem:{minHeight:48,justifyContent:"center",paddingHorizontal:space.sm},delete:{color:colors.error,fontWeight:"700"},
});
