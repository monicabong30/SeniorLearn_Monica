import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: { select: <T,>(values: { default: T }) => values.default },
  Pressable: "Pressable",
  StyleSheet: { create: <T,>(styles: T) => styles },
  TextInput: "TextInput",
  View: "View",
}));
vi.mock("./ScaledText", () => ({ ScaledText: "Text" }));

import { NumberInputField } from "./NumberInputField";

describe("NumberInputField", () => {
  it("keeps only whole-number characters, including pasted text", () => {
    const onChangeText = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NumberInputField label="Capacity" value="" onChangeText={onChangeText} minimum={1} required />); });
    renderer!.root.findByProps({ accessibilityLabel: "Capacity" }).props.onChangeText("12a.-3");
    expect(onChangeText).toHaveBeenCalledWith("123");
  });

  it("steps within its minimum and maximum bounds", () => {
    const onChangeText = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NumberInputField label="Capacity" value="2" onChangeText={onChangeText} minimum={1} maximum={2} />); });
    const increase = renderer!.root.find((node) => node.props.accessibilityLabel === "Increase Capacity");
    const decrease = renderer!.root.find((node) => node.props.accessibilityLabel === "Decrease Capacity");
    expect(increase.props.disabled).toBe(true);
    act(() => decrease.props.onPress());
    expect(onChangeText).toHaveBeenCalledWith("1");
  });
});
