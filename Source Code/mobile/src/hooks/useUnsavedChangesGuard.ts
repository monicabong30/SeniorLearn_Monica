import { useCallback, useRef, useState } from "react";
import { usePreventRemove } from "expo-router";

/**
 * Protects every navigation action that removes the current route, including
 * stack headers, Android Back, browser Back and native back gestures.
 *
 * Call `discard` only from the explicit destructive action in the dialog.
 */
export function useUnsavedChangesGuard(isDirty: boolean, isSubmitting = false) {
  const [visible, setVisible] = useState(false);
  const [allowRemoval, setAllowRemoval] = useState(false);
  const repeatRef = useRef<(() => void) | undefined>(undefined);

  usePreventRemove(isDirty && !isSubmitting && !allowRemoval, ({ repeat }) => {
    // Several platform events can arrive for one navigation attempt. Retain the
    // first action and show exactly one dialog.
    if (!repeatRef.current) repeatRef.current = repeat;
    setVisible(true);
  });

  const keepEditing = useCallback(() => {
    repeatRef.current = undefined;
    setVisible(false);
  }, []);

  const discard = useCallback(() => {
    const repeat = repeatRef.current;
    repeatRef.current = undefined;
    setVisible(false);
    setAllowRemoval(true);
    // The prevention state must update before replaying the intercepted action.
    requestAnimationFrame(() => repeat?.());
  }, []);

  return { discardConfirmationVisible: visible, keepEditing, discard };
}
