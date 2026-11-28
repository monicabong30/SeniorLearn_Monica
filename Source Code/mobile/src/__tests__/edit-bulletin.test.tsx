import React from "react";
import { act, create, type ReactTestRenderer, type ReactTestInstance } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, put, show, replace } = vi.hoisted(() => ({
  get: vi.fn(), put: vi.fn(), show: vi.fn(), replace: vi.fn(),
}));

vi.mock("react-native", () => ({
  AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => undefined }) },
  ActivityIndicator: "ActivityIndicator", Platform: { OS: "web", select: <T,>(values: { default: T }) => values.default }, Pressable: "Pressable", ScrollView: "ScrollView",
  StyleSheet: { create: <T,>(styles: T) => styles }, Text: "Text", TextInput: "TextInput", View: "View",
}));
vi.mock("expo-router", () => ({ useLocalSearchParams: () => ({ id: "bulletin-1" }), useRouter: () => ({ replace }) }));
vi.mock("../context/Feedback", () => ({ useFeedback: () => ({ show }) }));
vi.mock("../context/Preferences", () => ({ usePreferences: () => ({ fontScale: 1 }) }));
vi.mock("../components/ScaledText", () => ({ ScaledText: "Text" }));
vi.mock("../lib/api", () => ({ api: { get, put } }));

import EditBulletin from "../../app/admin/create-bulletin";

const bulletin = { title: "Library holiday hours", body: "The library will be open from ten until four." };

function assertNoRawTextUnderView(node: ReactTestInstance) {
  const hostType = node.type as string;
  if (typeof node.type === "string" && hostType !== "Text" && hostType !== "TextInput") {
    for (const child of node.children) expect(typeof child).not.toBe("string");
  }
  node.children.filter((child): child is ReactTestInstance => typeof child !== "string").forEach(assertNoRawTextUnderView);
}

describe("Edit Bulletin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders loaded form values without View text nodes and enables save only after edits", async () => {
    get.mockResolvedValue({ data: bulletin });
    let renderer: ReactTestRenderer;
    await act(async () => { renderer = create(<EditBulletin />); });

    const title = renderer!.root.findByProps({ accessibilityLabel: "Bulletin Title" });
    const body = renderer!.root.findByProps({ accessibilityLabel: "Bulletin Message" });
    const save = renderer!.root.findByProps({ accessibilityLabel: "Save Changes" });
    expect(get).toHaveBeenCalledWith("/bulletins/bulletin-1");
    expect(title.props.value).toBe(bulletin.title);
    expect(body.props.value).toBe(bulletin.body);
    expect(save.props.disabled).toBe(true);
    assertNoRawTextUnderView(renderer!.root);

    await act(async () => { title.props.onChangeText("Updated library holiday hours"); });
    expect(renderer!.root.findByProps({ accessibilityLabel: "Save Changes" }).props.disabled).toBe(false);
  });
});
