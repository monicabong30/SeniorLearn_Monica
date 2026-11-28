import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/tokens";

/** Shared password field with an independent, accessible visibility toggle. */
export function PasswordInput({ style, containerStyle, ...props }: TextInputProps & { containerStyle?: ViewStyle }) {
  const [visible, setVisible] = useState(false);
  return <View style={[s.wrap, containerStyle]}>
    <TextInput {...props} secureTextEntry={!visible} style={[style, s.input]} />
    <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"} accessibilityHint="Keeps the password you entered" hitSlop={8} onPress={() => setVisible((current) => !current)} style={({ pressed }) => [s.toggle, pressed && s.pressed]}>
      <Ionicons accessible={false} name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
    </Pressable>
  </View>;
}
const s = StyleSheet.create({ wrap: { position: "relative", justifyContent: "center" }, input: { paddingRight: 56 }, toggle: { position: "absolute", right: 4, minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10 }, pressed: { backgroundColor: "#e8eff5" } });
