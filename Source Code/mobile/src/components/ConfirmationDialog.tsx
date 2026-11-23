import { Modal, StyleSheet, View } from "react-native";
import { AppButton, Card } from "./ui";
import { ScaledText as Text } from "./ScaledText";
import { colors, space, type } from "../theme/tokens";

export type ConfirmationVariant = "primary" | "destructive";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  /** Preferred semantic action labels. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** @deprecated Use cancelLabel. */
  safeLabel?: string;
  /** @deprecated Use confirmLabel. */
  destructiveLabel?: string;
  variant?: ConfirmationVariant;
  loading?: boolean;
  error?: string;
  onDismiss: () => void;
  onConfirm: () => void;
};

/** Shared cross-platform confirmation guard. It never performs work itself. */
export function ConfirmationDialog({ visible, title, message, confirmLabel, cancelLabel, safeLabel, destructiveLabel, variant, loading, error, onDismiss, onConfirm }: Props) {
  const confirmationLabel = confirmLabel ?? destructiveLabel ?? "Confirm";
  const dismissalLabel = cancelLabel ?? safeLabel ?? "Cancel";
  const confirmationVariant = variant ?? (/(delete|remove|cancel)/i.test(confirmationLabel) ? "destructive" : "primary");
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={loading ? undefined : onDismiss}>
    <View style={s.overlay}><Card style={s.dialog}>
      <Text accessibilityRole="header" style={s.title}>{title}</Text>
      <Text style={s.message}>{message}</Text>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <View style={s.actions}>
        <AppButton label={confirmationLabel} variant={confirmationVariant} loading={loading} disabled={loading} onPress={onConfirm} accessibilityHint={loading ? "Confirmation in progress" : undefined}/>
        <AppButton label={dismissalLabel} variant="outline" disabled={loading} onPress={onDismiss}/>
      </View>
    </Card></View>
  </Modal>;
}
const s=StyleSheet.create({overlay:{flex:1,backgroundColor:"rgba(0,0,0,.35)",justifyContent:"center",padding:space.lg},dialog:{gap:space.md,maxWidth:500,width:"100%",alignSelf:"center"},title:{...type.section,color:colors.primary},message:{...type.body,color:colors.text},error:{color:colors.error},actions:{gap:space.sm}});
