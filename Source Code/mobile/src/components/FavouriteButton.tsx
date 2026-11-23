import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { useFeedback } from "../context/Feedback";
import { api } from "../lib/api";
import { colors } from "../theme/tokens";

export function FavouriteButton({
  classId,
  onChanged,
}: {
  classId: string;
  onChanged?: () => void;
}) {
  const [favourited, setFavourited] = useState(false);
  const [pending, setPending] = useState(false);
  const { show } = useFeedback();
  const load = async () => {
    try {
      setFavourited(
        !!(await api.get(`/favourites/${classId}`)).data.favourited,
      );
    } catch {
      /* Class content remains usable if this optional state cannot load. */
    }
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [classId]),
  );
  const toggle = async () => {
    try {
      setPending(true);
      if (favourited) {
        await api.delete(`/favourites/${classId}`);
        show("SUCCESS", "Class removed from Favourites.");
      } else {
        await api.post("/favourites", { classId });
        show("SUCCESS", "Class added to Favourites.");
      }
      setFavourited((value) => !value);
      onChanged?.();
    } catch {
      show("ERROR", "Unable to update Favourites.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        favourited ? "Remove from Favourites" : "Add to Favourites"
      }
      disabled={pending}
      onPress={(event) => {
        event.stopPropagation?.();
        void toggle();
      }}
      hitSlop={10}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        opacity: pending ? 0.5 : 1,
      }}
    >
      <Ionicons
        name={favourited ? "heart" : "heart-outline"}
        size={24}
        color={colors.primary}
      />
    </Pressable>
  );
}
