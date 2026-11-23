import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/Auth";
import {
  bottomTabSlots,
  adminTabRoute,
  adminTabSlots,
  activeAdminTab,
  tabRouteKey,
  type BottomTabSlot, type NavigationSlot,
} from "../lib/navigation";
import { colors } from "../theme/tokens";
import { canAdmin } from "../lib/permissions";
import { ScaledText as Text } from "./ScaledText";

const tabDetails: Record<
  NavigationSlot,
  { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon?: keyof typeof Ionicons.glyphMap }
> = {
  enrolments: { label: "My Learning", icon: "school-outline" },
  tutor: { label: "Tutor", icon: "people-outline" },
  admin: { label: "Dashboard", icon: "grid-outline", activeIcon: "grid" },
  favourites: { label: "Favourites", icon: "heart-outline" },
  index: { label: "Classes", icon: "calendar-outline" },
  help: { label: "Help", icon: "help-circle-outline" },
  profile: { label: "Profile", icon: "person-outline" },
  adminMembers: { label: "Members", icon: "people-outline", activeIcon: "people" },
  adminClasses: { label: "Classes", icon: "calendar-outline", activeIcon: "calendar" },
  adminBulletins: { label: "Bulletins", icon: "newspaper-outline", activeIcon: "newspaper" },
};

type BottomTabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigateToTab: (routeKey: string) => void;
};

/** Shared by the tab navigator and standalone Admin management routes. */
export function AdminBottomNavigation() {
  return <BottomTabBar state={{ index: 2, routes: adminTabSlots().map(name => ({ key: name, name })) }} navigateToTab={() => undefined} />;
}

export function BottomTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const selected = state.routes[state.index]?.name;
  const slots = canAdmin(user) ? adminTabSlots() : bottomTabSlots(user);

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {slots.map((slot) => {
        const details = tabDetails[slot];
        const isAdminNavigation = canAdmin(user);
        const active = isAdminNavigation ? activeAdminTab(pathname) === slot : selected === slot;
        const isClasses = isAdminNavigation ? slot === "admin" : slot === "index";
        const routeKey = tabRouteKey(state.routes, slot as BottomTabSlot);
        return (
          <Pressable
            key={slot}
            accessibilityRole="tab"
            accessibilityLabel={details.label}
            accessibilityState={{ selected: active }}
            disabled={!isAdminNavigation && !routeKey}
            onPress={() => {
              if (isAdminNavigation) router.replace(adminTabRoute(slot as any) as any);
              else if (routeKey) navigateToTab(routeKey);
            }}
            style={({ pressed }) => [
              s.slot,
              isClasses && s.classesSlot,
              pressed && s.pressed,
            ]}
          >
            <View style={isClasses ? s.classesIcon : undefined}>
              <Ionicons
                name={active && details.activeIcon ? details.activeIcon : details.icon}
                size={isClasses ? 25 : 22}
                color={
                  isClasses
                    ? "#fff"
                    : active
                      ? colors.primary
                      : colors.textSecondary
                }
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                s.label,
                active && s.activeLabel,
                isClasses && s.classesLabel,
              ]}
            >
              {details.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  slot: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    cursor: "pointer" as any,
  },
  classesSlot: { transform: [{ translateY: -15 }] },
  classesIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    ...({ elevation: 5, shadowColor: '#001a33', shadowOpacity: 0.24, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } } as any),
  },
  label: {
    maxWidth: "100%",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  activeLabel: { color: colors.primary },
  classesLabel: { marginTop: 2, fontWeight: "700", color: colors.primary },
  pressed: { opacity: 0.78 },
});
