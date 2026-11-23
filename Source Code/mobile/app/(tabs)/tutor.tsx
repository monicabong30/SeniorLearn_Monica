import { ScaledText as Text } from "../../src/components/ScaledText";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/context/Auth";
import { useFeedback } from "../../src/context/Feedback";
import { api } from "../../src/lib/api";
import {
  AppButton,
  Card,
  PageTitle,
  StatusBadge,
} from "../../src/components/ui";
import { colors, space, type } from "../../src/theme/tokens";
import { canTutor } from '../../src/lib/permissions';
import { ConfirmationDialog } from "../../src/components/ConfirmationDialog";
const schedule = (item: any) => {
  const start = new Date(item.startsAt),
    end = new Date(start.getTime() + item.durationMinutes * 60000);
  return {
    date: start.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
  };
};
export default function Tutor() {
  const { user } = useAuth(),
    router = useRouter(),
    { width } = useWindowDimensions(),
    [items, setItems] = useState<any[]>([]),
    [pending, setPending] = useState<string | null>(null),
    [menu, setMenu] = useState<any>(),
    [cancelConfirmation, setCancelConfirmation] = useState<any>(),
    { show } = useFeedback(),
    wide = width >= 760;
  const load = async () => {
    try {
      const rows = (await api.get("/classes", { params: { mine: "true" } }))
        .data;
      const withCounts = await Promise.all(
        rows.map(async (x: any) => {
          try {
            return {
              ...x,
              enrollmentCount: (await api.get(`/classes/${x._id}/roster`)).data
                .count,
            };
          } catch {
            return x;
          }
        }),
      );
      setItems(withCounts);
    } catch {
      show("ERROR", "Unable to load classes.");
    }
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, []),
  );
  if (!canTutor(user))
    return (
      <View style={s.page}>
        <Text>Professional member access is required.</Text>
      </View>
    );
  const action = async (item: any, kind: "publish" | "cancel") => {
    setMenu(undefined);
    if (kind === "cancel") {
      setCancelConfirmation(item);
      return;
    }
    void mutate(item, kind);
  };
  const mutate = async (item: any, kind: "publish" | "cancel") => {
    try {
      setPending(`${kind}:${item._id}`);
      await api.post(`/classes/${item._id}/${kind}`);
      await load();
      if (kind === "cancel") setCancelConfirmation(undefined);
      show(
        "SUCCESS",
        kind === "publish"
          ? "Class published successfully."
          : "Class cancelled successfully.",
      );
    } catch {
      show("ERROR", "Unable to update this class.");
    } finally {
      setPending(null);
    }
  };
  const card = ({ item }: any) => {
    const info = schedule(item);
    return (
      <Card style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardTitle}>
            <Text style={s.title}>{item.title}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`More actions for ${item.title}`}
            onPress={() => setMenu(item)}
            hitSlop={10}
            style={s.more}
          >
            <Text style={s.moreText}>⋯</Text>
          </Pressable>
        </View>
        <Text style={s.meta}>{info.date}</Text>
        <Text style={s.meta}>{info.time}</Text>
        {typeof item.enrollmentCount === "number" && (
          <Text style={s.meta}>
            {item.enrollmentCount} / {item.capacity} members enrolled
          </Text>
        )}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View details for ${item.title}`}
          onPress={() => router.push(`/class/${item._id}`)}
          style={s.details}
        >
          <Text style={s.detailsText}>View Details →</Text>
        </Pressable>
      </Card>
    );
  };
  return (
    <View style={s.page}>
      <FlatList
        key={wide ? "wide" : "narrow"}
        numColumns={wide ? 2 : 1}
        columnWrapperStyle={wide ? s.columns : undefined}
        contentContainerStyle={[
          s.list,
          { maxWidth: 1160, alignSelf: "center", width: "100%" },
        ]}
        ListHeaderComponent={
          <>
            <PageTitle
              title="Tutor dashboard"
              subtitle="Create, publish and manage your classes."
            />
            <View style={[s.quick, wide && s.quickWide]}>
              <AppButton
                label="Create class"
                onPress={() => router.push("/tutor/create")}
              />
              <AppButton
                label="Create recurring classes"
                variant="outline"
                onPress={() => router.push("/tutor/recurring-create")}
              />
              <AppButton
                label="Manage recurring classes"
                variant="outline"
                onPress={() => router.push("/tutor/recurring")}
              />
            </View>
            <Text style={s.section}>My classes</Text>
          </>
        }
        data={items}
        keyExtractor={(x) => x._id}
        renderItem={card}
        ListEmptyComponent={<Text>No classes created yet.</Text>}
      />
      <Modal
        transparent
        visible={!!menu}
        animationType="fade"
        onRequestClose={() => setMenu(undefined)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss class actions"
          onPress={() => setMenu(undefined)}
          style={s.backdrop}
        >
          <View style={s.menu}>
            {menu && (
              <>
                <Text style={s.menuTitle}>{menu.title}</Text>
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => {
                    setMenu(undefined);
                    router.push({
                      pathname: "/tutor/edit",
                      params: { id: menu._id },
                    });
                  }}
                  style={s.menuItem}
                >
                  <Text>Edit class</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="menuitem"
                  onPress={() => {
                    setMenu(undefined);
                    router.push({
                      pathname: "/tutor/roster",
                      params: { id: menu._id },
                    });
                  }}
                  style={s.menuItem}
                >
                  <Text>Enrollment roster</Text>
                </Pressable>
                {menu.status === "DRAFT" && (
                  <Pressable
                    accessibilityRole="menuitem"
                    disabled={!!pending}
                    onPress={() => action(menu, "publish")}
                    style={s.menuItem}
                  >
                    <Text>Publish draft</Text>
                  </Pressable>
                )}
                {!["CANCELLED", "COMPLETE"].includes(menu.status) && (
                  <Pressable
                    accessibilityRole="menuitem"
                    disabled={!!pending}
                    onPress={() => action(menu, "cancel")}
                    style={s.menuItem}
                  >
                    <Text style={s.destructive}>Cancel class</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
      <ConfirmationDialog
        visible={!!cancelConfirmation}
        title="Cancel class?"
        message="This will cancel the class for enrolled members."
        confirmLabel="Cancel class"
        cancelLabel="Keep class"
        variant="destructive"
        loading={pending === `cancel:${cancelConfirmation?._id}`}
        onDismiss={() => setCancelConfirmation(undefined)}
        onConfirm={() => void mutate(cancelConfirmation, "cancel")}
      />
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: space.lg, gap: space.md, paddingBottom: 110 },
  columns: { gap: space.md },
  quick: { gap: space.sm, marginBottom: space.xl },
  quickWide: { flexDirection: "row", alignItems: "center" },
  section: { ...type.section, color: colors.primary, marginBottom: space.sm },
  card: { flex: 1, marginBottom: space.md, gap: space.sm },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space.sm,
  },
  cardTitle: { flex: 1, gap: space.xs },
  title: { ...type.section, color: colors.primary },
  meta: { color: colors.textSecondary },
  more: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  moreText: {
    fontSize: 28,
    lineHeight: 28,
    color: colors.primary,
    fontWeight: "700",
  },
  details: { alignSelf: "flex-start", paddingVertical: space.xs },
  detailsText: { color: colors.primary, fontWeight: "700" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.35)",
    justifyContent: "center",
    padding: space.lg,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.md,
    gap: space.xs,
    maxWidth: 360,
    width: "100%",
    alignSelf: "center",
  },
  menuTitle: { ...type.section, color: colors.primary, marginBottom: space.xs },
  menuItem: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.sm,
    borderRadius: 8,
  },
  destructive: { color: colors.error, fontWeight: "700" },
});
