import type { ReactNode } from "react";
import { Modal, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

/**
 * A non-destructive modal whose backdrop is the only dismiss target. Keeping
 * the backdrop as a sibling of the content prevents presses inside content
 * from bubbling into dismissal on native and web.
 */
export function DismissibleModal({
  visible,
  onDismiss,
  children,
  animationType = "fade",
  backdropStyle,
  accessibilityLabel = "Close dialog",
}: {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  animationType?: "none" | "slide" | "fade";
  backdropStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return <Modal visible={visible} transparent animationType={animationType} onRequestClose={onDismiss}>
    <View style={[s.backdrop, backdropStyle]}>
      <Pressable accessibilityLabel={accessibilityLabel} onPress={onDismiss} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={s.content}>{children}</View>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  backdrop: { flex: 1 },
  content: { flexShrink: 1 },
});
