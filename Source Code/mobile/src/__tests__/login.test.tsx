import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

const { router } = vi.hoisted(() => ({ router: { push: vi.fn(), replace: vi.fn(), setParams: vi.fn() } }));

vi.mock("react-native", () => ({
  AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => undefined }) },
  ActivityIndicator: "ActivityIndicator", KeyboardAvoidingView: "KeyboardAvoidingView",
  Platform: { OS: "web", select: <T,>(values: { web?: T; default: T }) => values.web ?? values.default }, Pressable: "Pressable", ScrollView: "ScrollView",
  StyleSheet: { create: <T,>(styles: T) => styles, flatten: <T,>(value: T) => value }, TextInput: "TextInput", View: "View",
}));
vi.mock("expo-router", () => ({ useRouter: () => router, useLocalSearchParams: () => ({ registered: "1", email: "new@example.com" }) }));
vi.mock("../context/Auth", () => ({ useAuth: () => ({ signIn: vi.fn() }) }));
vi.mock("../context/Feedback", () => ({ useFeedback: () => ({ show: vi.fn() }) }));
vi.mock("../context/Preferences", () => ({ usePreferences: () => ({ fontScale: 1 }) }));
vi.mock("../components/ScaledText", () => ({ ScaledText: "Text" }));

import Login from "../../app/(auth)/login";

describe("Login registration success", () => {
  it("shows a dismissible registration success banner and never signs in automatically", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<Login />); });
    expect(JSON.stringify(renderer!.toJSON())).toContain("Registration Successful!");
    expect(renderer!.root.find((node) => node.props.accessibilityLabel === "Email address").props.value).toBe("new@example.com");
    act(() => renderer!.root.find((node) => node.props.accessibilityLabel === "Dismiss registration success message").props.onPress());
    expect(router.setParams).toHaveBeenCalledWith({ registered: undefined, email: undefined });
  });
});
