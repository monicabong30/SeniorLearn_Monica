import React from "react";
import { act, create } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, push } = vi.hoisted(() => ({ get: vi.fn(), push: vi.fn() }));

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove: () => undefined }),
  },
  Alert: { alert: vi.fn() },
  Platform: { OS: "web", select: <T,>(values: { default: T }) => values.default },
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  StyleSheet: { create: <T,>(styles: T) => styles },
  View: "View",
}));
vi.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "member-1" }),
  useRouter: () => ({ push }),
}));
vi.mock("../context/Preferences", () => ({
  usePreferences: () => ({ fontScale: 1 }),
}));
vi.mock("../components/ScaledText", () => ({ ScaledText: "Text" }));
vi.mock("../lib/api", () => ({
  api: { get },
  errorMessage: () => "Unable to load member.",
}));

import Member from "../../app/admin/member";

describe("Admin member detail header", () => {
  beforeEach(() => vi.clearAllMocks());

  async function renderMember(user: Record<string, unknown>) {
    get.mockResolvedValue({
      data: { user, membership: { status: "ACTIVE" }, payments: [] },
    });
    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(<Member />);
    });
    return renderer!;
  }

  it("shows the member name above their email", async () => {
    const renderer = await renderMember({
      name: "Patricia Member",
      email: "pat@example.com",
      roles: ["STANDARD"],
    });
    const text = renderer.root.findAll((node) => node.type === ("Text" as any));
    const name = text.find((node) => node.children.includes("Patricia Member"));
    const email = text.find((node) => node.children.includes("pat@example.com"));

    expect(name?.props.accessibilityRole).toBe("header");
    expect(email).toBeDefined();
    expect(text.indexOf(name!)).toBeLessThan(text.indexOf(email!));
  });

  it("uses safe fallbacks when member name or email is unavailable", async () => {
    const renderer = await renderMember({ roles: [] });
    const values = renderer.root
      .findAll((node) => node.type === ("Text" as any))
      .flatMap((node) => node.children)
      .filter((value): value is string => typeof value === "string");

    expect(values).toContain("Member");
    expect(values).toContain("Email not available");
  });
});
