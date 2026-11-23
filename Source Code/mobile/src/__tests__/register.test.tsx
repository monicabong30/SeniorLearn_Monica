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
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Platform: { OS: "web", select: <T,>(values: { default: T }) => values.default },
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  StyleSheet: { create: <T,>(styles: T) => styles, flatten: <T,>(value: T) => value },
  TextInput: "TextInput",
  View: "View",
}));
vi.mock("expo-router", () => ({ useRouter: () => router }));
vi.mock("../context/Auth", () => ({ useAuth: () => ({ signIn }) }));
vi.mock("../context/Feedback", () => ({ useFeedback: () => ({ show: vi.fn() }) }));
vi.mock("../lib/api", () => ({ api: { post }, loginErrorMessage: vi.fn() }));
vi.mock("../context/Preferences", () => ({ usePreferences: () => ({ fontScale: 1 }) }));
vi.mock("../components/ScaledText", () => ({ ScaledText: "Text" }));

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
    expect(labels).toEqual([
      "Full name",
      "Email address",
      "Phone number",
      "Password",
      "Confirm password",
    ]);
    expect(JSON.stringify(tree)).not.toContain("Date of birth");
  });

  it("shows validation messages without creating raw View text", async () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<Register />);
    });

    await act(async () => {
      renderer!.root
        .find((node) => node.props.accessibilityLabel === "Register")
        .props.onPress();
    });

    const tree = renderer!.toJSON() as Tree;
    expect(rawTextOutsideText(tree)).toEqual([]);
    expect(JSON.stringify(tree)).toContain("Please enter your full name.");
    expect(JSON.stringify(tree)).toContain("Email address is required.");
  });

  it("redirects successful registration to Login without creating a session", async () => {
    post.mockResolvedValueOnce({ data: { token: "returned-but-unused", user: { id: "1" } } });
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<Register />); });
    const inputs = renderer!.root.findAll((node) => (node.type as unknown) === "TextInput");
    const values = ["New Member", "new@example.com", "0412345678", "SeniorLearn1!", "SeniorLearn1!"];
    inputs.forEach((input, index) => act(() => input.props.onChangeText(values[index])));
    await act(async () => {
      renderer!.root.find((node) => node.props.accessibilityLabel === "Register").props.onPress();
    });
    expect(signIn).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith({ pathname: "/(auth)/login", params: { registered: "1", email: "new@example.com" } });
  });
});
