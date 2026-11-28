import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

const { router, signIn, post } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn(), setParams: vi.fn() },
  signIn: vi.fn(),
  post: vi.fn(),
}));

vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove: () => undefined }),
  },
  ActivityIndicator: "ActivityIndicator",
  Image: "Image",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Modal: "Modal",
  Platform: { OS: "web", select: <T,>(values: { default: T }) => values.default },
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  StyleSheet: { create: <T,>(styles: T) => styles, flatten: <T,>(value: T) => value },
  Text: "Text",
  TextInput: "TextInput",
  View: "View",
}));
vi.mock("expo-router", () => ({ useRouter: () => router }));
vi.mock("../context/Auth", () => ({ useAuth: () => ({ signIn }) }));
vi.mock("../context/Feedback", () => ({ useFeedback: () => ({ show: vi.fn() }) }));
vi.mock("../lib/api", () => ({ api: { post }, loginErrorMessage: vi.fn() }));
vi.mock("../context/Preferences", () => ({ usePreferences: () => ({ fontScale: 1 }) }));
vi.mock("../components/ScaledText", () => ({ ScaledText: "Text" }));
vi.mock("../components/DatePickerField", () => ({ DatePickerField: ({ label, value, onChange }: any) => React.createElement("TextInput", { accessibilityLabel: label, value, onChangeText: onChange }) }));

import Register from "../../app/(auth)/register";

type Tree = string | { type: string; children?: Tree[] } | null;

function rawTextOutsideText(node: Tree, insideText = false): string[] {
  if (typeof node === "string") return insideText ? [] : [node];
  if (!node) return [];
  return (node.children ?? []).flatMap((child) =>
    rawTextOutsideText(child, insideText || node.type === "Text"),
  );
}

describe("Register", () => {
  it("renders all shared fields without a raw text child of View", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Register />);
    });

    const tree = renderer!.toJSON() as Tree;
    expect(rawTextOutsideText(tree)).toEqual([]);
    const labels = renderer!.root
      .findAll((node) => (node.type as unknown) === "TextInput")
      .map((node) => node.props.accessibilityLabel);
    expect(labels).toEqual(["Full name", "Date of birth", "Phone number"]);
    expect(JSON.stringify(tree)).toContain("Your details");
  });

  it("shows validation messages without creating raw View text", async () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Register />);
    });

    await act(async () => {
      renderer!.root
        .find((node) => node.props.accessibilityLabel === "Continue")
        .props.onPress();
    });

    const tree = renderer!.toJSON() as Tree;
    expect(rawTextOutsideText(tree)).toEqual([]);
    expect(JSON.stringify(tree)).toContain("Enter your full name.");
    expect(JSON.stringify(tree)).toContain("Enter a valid phone number.");
  });

  it("signs in and opens the dashboard after successful registration", async () => {
    post.mockResolvedValueOnce({ data: { token: "new-session-token", user: { id: "1" } } });
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<Register />); });
    let inputs = renderer!.root.findAll((node) => (node.type as unknown) === "TextInput");
    ["New Member", "1950-01-01", "0412345678"].forEach((value, index) => act(() => inputs[index].props.onChangeText(value)));
    act(() => renderer!.root.find((node) => node.props.accessibilityLabel === "Continue").props.onPress());
    inputs = renderer!.root.findAll((node) => (node.type as unknown) === "TextInput");
    ["new@example.com", "SeniorLearn1!", "SeniorLearn1!"].forEach((value, index) => act(() => inputs[index].props.onChangeText(value)));
    act(() => renderer!.root.find((node) => node.props.accessibilityLabel === "Continue").props.onPress());
    act(() => renderer!.root.findAll((node) => node.props.accessibilityRole === "checkbox")[0].props.onPress());
    await act(async () => {
      renderer!.root.find((node) => node.props.accessibilityLabel === "Create account").props.onPress();
    });
    expect(signIn).toHaveBeenCalledWith("new-session-token", { id: "1" });
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });
});
