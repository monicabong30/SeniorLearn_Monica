import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, space, type } from "../theme/tokens";
import { ScaledText as Text } from "./ScaledText";

export type NumberInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  minimum?: number;
  maximum?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  accessibilityLabel?: string;
};

/** A cross-platform integer field with its own accessible stepper controls. */
export function NumberInputField({
  label,
  value,
  onChangeText,
  placeholder,
  minimum,
  maximum,
  step = 1,
  disabled = false,
  required = false,
  error,
  accessibilityLabel,
}: NumberInputFieldProps) {
  const numericValue = value === "" ? undefined : Number(value);
  const validInteger = numericValue !== undefined && Number.isInteger(numericValue);
  const belowMinimum = validInteger && minimum !== undefined && numericValue < minimum;
  const aboveMaximum = validInteger && maximum !== undefined && numericValue > maximum;
  // Required-state feedback is supplied by the owning form after submit/touch.
  // This lets an empty required field remain calm when a screen first opens.
  const validationError = error || (belowMinimum ? `${label} must be at least ${minimum}.` : aboveMaximum ? `${label} must be no more than ${maximum}.` : undefined);
  const decrementDisabled = disabled || numericValue === undefined || !validInteger || (minimum !== undefined && numericValue <= minimum);
  const incrementDisabled = disabled || (validInteger && maximum !== undefined && numericValue >= maximum);
  const change = (direction: 1 | -1) => {
    if (disabled) return;
    const base = validInteger ? numericValue : (minimum ?? 0);
    const next = base + direction * step;
    if ((minimum !== undefined && next < minimum) || (maximum !== undefined && next > maximum)) return;
    onChangeText(String(next));
  };
  return <View style={s.field}>
    <Text style={s.label}>{label}{required ? " *" : ""}</Text>
    <View style={[s.control, validationError && s.invalid, disabled && s.disabled]}>
      <TextInput
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={`Enter a whole number${minimum !== undefined ? `, at least ${minimum}` : ""}${maximum !== undefined ? ` and no more than ${maximum}` : ""}.`}
        editable={!disabled}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        inputMode="numeric"
        onChangeText={(next) => onChangeText(next.replace(/[^0-9]/g, ""))}
        style={s.input}
      />
      <View style={s.stepper}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} accessibilityState={{ disabled: incrementDisabled }} disabled={incrementDisabled} onPress={() => change(1)} hitSlop={6} style={({ pressed }) => [s.stepButton, pressed && !incrementDisabled && s.pressed]}>
          <Ionicons accessible={false} name="chevron-up" size={20} color={incrementDisabled ? colors.disabled : colors.primary} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} accessibilityState={{ disabled: decrementDisabled }} disabled={decrementDisabled} onPress={() => change(-1)} hitSlop={6} style={({ pressed }) => [s.stepButton, pressed && !decrementDisabled && s.pressed]}>
          <Ionicons accessible={false} name="chevron-down" size={20} color={decrementDisabled ? colors.disabled : colors.primary} />
        </Pressable>
      </View>
    </View>
    {validationError ? <Text accessibilityRole="alert" style={s.error}>{validationError}</Text> : null}
  </View>;
}

const s = StyleSheet.create({
  field: { gap: space.xs },
  label: { ...type.body, fontWeight: "600", color: colors.text },
  control: { minHeight: 52, flexDirection: "row", overflow: "hidden", borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
  input: { flex: 1, minWidth: 0, paddingHorizontal: space.md, ...type.body, color: colors.text },
  stepper: { width: 52, borderLeftWidth: 1, borderLeftColor: colors.separator, justifyContent: "center" },
  stepButton: { flex: 1, minHeight: 26, alignItems: "center", justifyContent: "center" },
  invalid: { borderColor: colors.error },
  disabled: { opacity: 0.52 },
  pressed: { backgroundColor: colors.secondary },
  error: { ...type.secondary, color: colors.error },
});
