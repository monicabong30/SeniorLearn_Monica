import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Modal: "Modal",
  Platform: { select: <T,>(values: { default: T }) => values.default },
  Pressable: "Pressable",
  StyleSheet: { create: <T,>(styles: T) => styles, flatten: <T,>(value: T) => value },
  Text: "Text",
  View: "View",
}));
vi.mock("../context/Preferences", () => ({
  usePreferences: () => ({ fontScale: 1 }),
}));
vi.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
vi.mock("./MonthYearWheelPicker", () => ({
  MonthYearWheelPicker: "MonthYearWheelPicker",
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
}));

import { DatePickerField } from "./DatePickerField";

type Tree = string | { type: string; children?: Tree[] } | null;

function rawTextOutsideText(node: Tree, insideText = false): string[] {
  if (typeof node === "string") return insideText ? [] : [node];
  if (!node) return [];
  return (node.children ?? []).flatMap((child) =>
    rawTextOutsideText(child, insideText || node.type === "Text"),
  );
}

describe("DatePickerField", () => {
  it("keeps calendar labels and a selected date inside Text components", () => {
    const onChange = vi.fn();
    let renderer: ReturnType<typeof create>;

    act(() => {
      renderer = create(
        <DatePickerField
          label="Date of birth"
          value="2020-01-01"
          maximumDate="2020-12-31"
          onChange={onChange}
        />,
      );
    });

    act(() => {
      renderer!.root.find((node) => node.props.accessibilityLabel === "Choose Date of birth").props.onPress();
    });
    act(() => {
      renderer!.root.find((node) => node.props.accessibilityLabel === "2 January 2020").props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith("2020-01-02");
    expect(rawTextOutsideText(renderer!.toJSON() as Tree)).toEqual([]);
  });
});
