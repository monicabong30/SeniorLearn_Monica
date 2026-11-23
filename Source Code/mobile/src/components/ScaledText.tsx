import {
  Text as NativeText,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from "react-native";
import { usePreferences } from "../context/Preferences";
import { scaleTypographyStyle } from "../lib/typography";

/** Applies the saved SeniorLearn preference once, without disabling OS font scaling. */
export function scaledTextStyle(style: TextProps["style"], fontScale: number) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  return flat && (flat.fontSize !== undefined || flat.lineHeight !== undefined)
    ? scaleTypographyStyle(flat, fontScale)
    : style;
}
export function ScaledText({ style, ...props }: TextProps) {
  const { fontScale } = usePreferences();
  const scaled = scaledTextStyle(style, fontScale);
  return <NativeText {...props} style={scaled} />;
}
