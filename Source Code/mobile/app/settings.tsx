import { useState } from "react";
import Slider from "@react-native-community/slider";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { usePreferences } from "../src/context/Preferences";
import { useFeedback } from "../src/context/Feedback";
import { AppButton, Card } from "../src/components/ui";
import { colors, space, type } from "../src/theme/tokens";
import {
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
  TEXT_SCALE_STEP,
} from "../src/lib/preferences";
import { ScaledText as Text } from "../src/components/ScaledText";
export default function Settings() {
  const { fontScale, setFontScale, reset } = usePreferences(),
    { show } = useFeedback(),
    [confirm, setConfirm] = useState(false);
  const applyReset = async () => {
    try {
      await reset();
      setConfirm(false);
      show("SUCCESS", "Settings restored to default.");
    } catch {
      show("ERROR", "Settings could not be reset.");
    }
  };
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.intro}>Make SeniorLearn comfortable to use on this device.</Text>
      <Text style={s.group}>Preferences</Text>
      <Card>
        <Text style={s.heading}>Text size</Text>
        <View style={s.slider}>
          <Text>A−</Text>
          <Slider
            accessibilityLabel="Text size"
            accessibilityValue={{
              min: TEXT_SCALE_MIN,
              max: TEXT_SCALE_MAX,
              now: fontScale,
              text: `${fontScale.toFixed(2)} times`,
            }}
            style={{ flex: 1, minHeight: 44 }}
            minimumValue={TEXT_SCALE_MIN}
            maximumValue={TEXT_SCALE_MAX}
            step={TEXT_SCALE_STEP}
            value={fontScale}
            onValueChange={setFontScale}
            minimumTrackTintColor={colors.primary}
          />
          <Text>A+</Text>
        </View>
        <Text accessibilityLiveRegion="polite">
          Current size: {fontScale.toFixed(2)}×
        </Text>
      </Card>
      <AppButton label="Reset settings to default" variant="text" onPress={() => setConfirm(true)} />
      <Modal
        transparent
        visible={confirm}
        onRequestClose={() => setConfirm(false)}
      >
        <View style={s.overlay}>
          <Card style={s.dialog}>
            <Text style={s.heading}>Reset settings?</Text>
            <Text>
              This restores text size and local preferences to their defaults.
              Your account and learning data are not changed.
            </Text>
            <View style={s.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirm(false)}
                style={s.cancel}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void applyReset()}
                style={s.reset}
              >
                <Text style={s.resetText}>Reset</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: space.lg,
    gap: space.md,
    backgroundColor: colors.background,
  },
  group: { ...type.caption, color: colors.textSecondary, fontWeight: "700", textTransform: "uppercase", letterSpacing: .5, marginLeft: space.sm },
  intro: { ...type.secondary, color: colors.textSecondary },
  heading: { ...type.body, fontWeight: "700", color: colors.text },
  slider: { flexDirection: "row", alignItems: "center", gap: 8 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.35)",
    justifyContent: "center",
    padding: space.lg,
  },
  dialog: { gap: space.lg, maxWidth: 500, width: "100%", alignSelf: "center" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: space.md },
  cancel: { minHeight: 48, justifyContent: "center", paddingHorizontal: space.lg },
  reset: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  cancelText: { color: colors.primary, fontWeight: "700" },
  resetText: { color: "#fff", fontWeight: "700" },
});
