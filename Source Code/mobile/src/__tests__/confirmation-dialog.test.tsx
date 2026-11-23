import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => undefined }) },
  ActivityIndicator: "ActivityIndicator", Modal: "Modal", Platform: { select: <T,>(values: { default: T }) => values.default }, Pressable: "Pressable",
  StyleSheet: { create: <T,>(styles: T) => styles }, View: "View",
}));
vi.mock("../context/Preferences", () => ({ usePreferences: () => ({ fontScale: 1 }) }));
vi.mock("../components/ScaledText", () => ({ ScaledText: "Text" }));

import { ConfirmationDialog } from "../components/ConfirmationDialog";

describe("ConfirmationDialog", () => {
  const render = (props: Partial<React.ComponentProps<typeof ConfirmationDialog>> = {}) => {
    let tree!: ReturnType<typeof create>;
    act(() => {
      tree = create(<ConfirmationDialog visible title="Confirm action?" message="Confirmation details."
        confirmLabel="Save Changes" cancelLabel="Cancel" onConfirm={vi.fn()} onDismiss={vi.fn()} {...props} />);
    });
    return tree;
  };

  it("renders the primary action above Cancel using the navy primary variant", () => {
    const tree = render();
    const buttons = tree.root.findAll((node) => node.props.accessibilityRole === "button");
    expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual(["Save Changes", "Cancel"]);
    expect(buttons[0].props.style({ pressed: false })).toContainEqual({ backgroundColor: "#003366" });
  });

  it("uses destructive styling only when explicitly requested", () => {
    const tree = render({ confirmLabel: "Delete Bulletin", variant: "destructive" });
    const button = tree.root.findAll((node) => node.props.accessibilityLabel === "Delete Bulletin")[0];
    expect(button.props.style({ pressed: false })).toContainEqual({ backgroundColor: "#D92D20" });
  });

  it("dismisses without confirming, and loading prevents another confirmation", async () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    const tree = render({ onConfirm, onDismiss });
    const buttons = tree.root.findAll((node) => node.props.accessibilityRole === "button");
    await act(async () => { buttons[1].props.onPress(); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await act(async () => { buttons[0].props.onPress(); });
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const loading = render({ loading: true, onConfirm });
    const primary = loading.root.findAll((node) => node.props.accessibilityLabel === "Save Changes")[0];
    expect(primary.props.disabled).toBe(true);
  });
});
