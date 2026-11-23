import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove: () => undefined }),
  },
  ActivityIndicator: "ActivityIndicator",
  Platform: { select: <T,>(values: { default: T }) => values.default },
  Pressable: "Pressable",
  StyleSheet: { create: <T,>(styles: T) => styles },
  TextInput: "TextInput",
  View: "View",
}));
vi.mock("../context/Preferences", () => ({
  usePreferences: () => ({ fontScale: 1 }),
}));
vi.mock("./ScaledText", () => ({ ScaledText: "Text" }));

import { Field } from "./ui";

type Tree = string | { type: string; children?: Tree[] } | null;

function rawTextOutsideText(node: Tree, insideText = false): string[] {
  if (typeof node === "string") return insideText ? [] : [node];
  if (!node) return [];
  return (node.children ?? []).flatMap((child) =>
    rawTextOutsideText(child, insideText || node.type === "Text"),
  );
}

describe("Field", () => {
  it("uses an accessible eye icon for password visibility", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Field label="Password" secureTextEntry value="secret" />);
    });
    const toggle = renderer!.root.find((node) => node.props.accessibilityLabel === "Show password");
    expect(toggle).toBeTruthy();
    expect(renderer!.root.find((node) => node.props.name === "eye-outline")).toBeTruthy();
    act(() => toggle.props.onPress());
    expect(renderer!.root.find((node) => node.props.accessibilityLabel === "Hide password")).toBeTruthy();
    expect(renderer!.root.find((node) => node.props.name === "eye-off-outline")).toBeTruthy();
  });

  it("keeps labels and validation messages inside Text without raw View children", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <Field
          label="Full name"
          error="Please enter your full name."
          placeholder="Your name"
          value=""
        />,
      );
    });
    const tree = renderer!.toJSON() as Tree;
    expect(rawTextOutsideText(tree)).toEqual([]);
    expect(JSON.stringify(tree)).toContain("Full name");
    expect(JSON.stringify(tree)).toContain("Please enter your full name.");
  });

  it("does not render an empty error message or forwarded children", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <Field label="Email address" error="" value="" children="." />,
      );
    });
    const tree = renderer!.toJSON() as Tree;
    expect(rawTextOutsideText(tree)).toEqual([]);
    expect(JSON.stringify(tree)).not.toContain('"."');
  });
});
