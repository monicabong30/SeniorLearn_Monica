import { ScaledText as Text } from "./ScaledText";
import { colors, type } from "../theme/tokens";

/** Renders entity labels from notification metadata without guessing text patterns. */
export function NotificationBody({ item, numberOfLines }: { item: any; numberOfLines?: number }) {
  const body = item.body || "", label = item.entity?.label;
  if (!label || !body.includes(label)) return <Text numberOfLines={numberOfLines} style={{ ...type.body, color: colors.text }}>{body}</Text>;
  const [before, ...after] = body.split(label);
  return <Text numberOfLines={numberOfLines} style={{ ...type.body, color: colors.text }}>{before}<Text style={{ fontWeight: "700" }}>{label}</Text>{after.join(label)}</Text>;
}
