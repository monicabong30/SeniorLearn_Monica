import React from "react";
import { act, create } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, put, show, replace, back } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), show: vi.fn(), replace: vi.fn(), back: vi.fn() }));

vi.mock("react-native", () => ({
  AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => undefined }) },
  ActivityIndicator: "ActivityIndicator", Alert: { alert: vi.fn() }, Modal: "Modal", Platform: { OS: "web", select: <T,>(values: { default: T }) => values.default }, Pressable: "Pressable", ScrollView: "ScrollView", StyleSheet: { create: <T,>(styles: T) => styles }, View: "View", TextInput: "TextInput",
}));
vi.mock("expo-router", () => ({ useLocalSearchParams: () => ({ id: "member-1" }), useRouter: () => ({ replace, back }) }));
vi.mock("../context/Feedback", () => ({ useFeedback: () => ({ show }) }));
vi.mock("../context/Preferences", () => ({ usePreferences: () => ({ fontScale: 1 }) }));
vi.mock("../components/ScaledText", () => ({ ScaledText: "Text" }));
vi.mock("../components/DatePickerField", () => ({ DatePickerField: "DatePickerField" }));
vi.mock("../lib/api", () => ({ api: { get, put }, errorMessage: () => "Unable to save changes. Please try again." }));

import EditMember from "../../app/admin/edit-member";
import { ConfirmationDialog } from "../components/ConfirmationDialog";

const member = { user: { id: "member-1", name: "Pat Member", roles: ["STANDARD"], isAdmin: false }, membership: { status: "ACTIVE", expiresAt: "2028-01-01T00:00:00.000Z" } };

describe("EditMember save confirmation", () => {
  beforeEach(() => vi.clearAllMocks());
  const render = async () => {
    let renderer: ReturnType<typeof create>;
    await act(async () => { renderer = create(<EditMember />); });
    return renderer!;
  };
  const memberDetailsRoute = { pathname: "/admin/member", params: { id: "member-1" } };

  it("returns directly to the member details route when cancelling unchanged values", async () => {
    get.mockResolvedValue({ data: member });
    const renderer = await render();
    await act(async () => { renderer.root.findAll((node) => node.props.accessibilityLabel === "Cancel")[0].props.onPress(); });
    expect(replace).toHaveBeenCalledWith(memberDetailsRoute);
    expect(back).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it("confirms discarding dirty values and keeps editing without an API request", async () => {
    get.mockResolvedValue({ data: member });
    const renderer = await render();
    await act(async () => { renderer.root.find((node) => node.props.accessibilityLabel === "Toggle professional membership").props.onPress(); });
    await act(async () => { renderer.root.findAll((node) => node.props.accessibilityLabel === "Cancel")[0].props.onPress(); });
    const dialogs = () => renderer.root.findAllByType(ConfirmationDialog);
    expect(dialogs()[1].props.visible).toBe(true);
    expect(dialogs()[1].props.confirmLabel).toBe("Discard Changes");
    expect(dialogs()[1].props.cancelLabel).toBe("Keep Editing");
    await act(async () => { dialogs()[1].props.onDismiss(); });
    expect(dialogs()[1].props.visible).toBe(false);
    expect(put).not.toHaveBeenCalled();
    await act(async () => { renderer.root.findAll((node) => node.props.accessibilityLabel === "Cancel")[0].props.onPress(); });
    await act(async () => { dialogs()[1].props.onConfirm(); });
    expect(replace).toHaveBeenCalledWith(memberDetailsRoute);
    expect(put).not.toHaveBeenCalled();
  });

  it("opens, cancels, and confirms the canonical save exactly once", async () => {
    get.mockResolvedValue({ data: member });
    put.mockResolvedValue({ data: member });
    const renderer = await render();

    const saveButtons = () => renderer!.root.findAll((node) => node.props.accessibilityLabel === "Save Changes");
    expect(saveButtons()[0].props.disabled).toBe(true);
    await act(async () => { renderer!.root.find((node) => node.props.accessibilityLabel === "Toggle professional membership").props.onPress(); });
    expect(saveButtons()[0].props.disabled).toBe(false);

    await act(async () => { saveButtons()[0].props.onPress(); });
    const dialog = () => renderer!.root.findAllByType(ConfirmationDialog)[0];
    expect(dialog().props.visible).toBe(true);
    await act(async () => { dialog().props.onDismiss(); });
    expect(dialog().props.visible).toBe(false);

    await act(async () => { saveButtons()[0].props.onPress(); });
    await act(async () => { dialog().props.onConfirm(); });
    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith("/admin/members/member-1", { roles: ["PROFESSIONAL", "STANDARD"], status: "ACTIVE", expiresAt: "2028-01-01" });
    expect(replace).toHaveBeenCalledWith(memberDetailsRoute);
    expect(back).not.toHaveBeenCalled();
  });
});
