import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
} from "react-native";

/** Shared form container: iOS shifts content and Android relies on resize mode. */
export function KeyboardAwareScrollView(props: ScrollViewProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[{ flexGrow: 1 }, props.contentContainerStyle]}
        {...props}
      />
    </KeyboardAvoidingView>
  );
}
