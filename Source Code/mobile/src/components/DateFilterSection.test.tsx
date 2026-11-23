import React, { useState } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Platform: { select: <T,>(values: { default: T }) => values.default }, Pressable: "Pressable", StyleSheet: { create: <T,>(styles: T) => styles }, View: "View" }));
vi.mock("./ScaledText", () => ({ ScaledText: "Text" }));
vi.mock("./DatePickerField", () => ({ DatePickerField: "DatePickerField" }));

import { DateFilterSection, type DateFilterValue } from "./DateFilterSection";

function Harness() { const [value, setValue] = useState<DateFilterValue>({ type: "Created Date", startDate: "", endDate: "" }); return <DateFilterSection types={["Created Date", "Published Date"]} value={value} onChange={setValue} />; }

describe("DateFilterSection", () => {
  it("starts collapsed, preserves dates on collapse, and clears only dates", async () => {
    let renderer: ReturnType<typeof create>; await act(async () => { renderer = create(<Harness />); });
    const pickers = () => renderer!.root.findAll(node => String(node.type) === "DatePickerField");
    const header = () => renderer!.root.findByProps({ accessibilityLabel: "Filter by Date, collapsed" });
    expect(pickers()).toHaveLength(0);
    await act(async () => { header().props.onPress(); });
    expect(pickers()).toHaveLength(2);
    expect(pickers().map(picker => picker.props.compact)).toEqual([true, true]);
    await act(async () => { pickers()[0].props.onChange("2026-11-01"); });
    expect(pickers()[1].props.minimumDate).toBe("2026-11-01");
    await act(async () => { pickers()[1].props.onChange("2026-11-15"); });
    expect(pickers()[0].props.maximumDate).toBe("2026-11-15");
    expect(renderer!.root.findByProps({ accessibilityLabel: "Filter by Date, active, expanded" })).toBeTruthy();
    await act(async () => { renderer!.root.findByProps({ accessibilityLabel: "Filter by Date, active, expanded" }).props.onPress(); });
    expect(renderer!.root.findByProps({ accessibilityLabel: "Filter by Date, active, collapsed" })).toBeTruthy();
    await act(async () => { renderer!.root.findByProps({ accessibilityLabel: "Filter by Date, active, collapsed" }).props.onPress(); });
    expect(pickers()[0].props.value).toBe("2026-11-01");
    await act(async () => { renderer!.root.findByProps({ accessibilityLabel: "Clear Dates" }).props.onPress(); });
    expect(renderer!.root.findByProps({ accessibilityLabel: "Filter by Date, expanded" })).toBeTruthy();
  });

  it("shows an error for an invalid range without treating the date type as active", async () => {
    let renderer: ReturnType<typeof create>; await act(async () => { renderer = create(<Harness />); });
    const pickers = () => renderer!.root.findAll(node => String(node.type) === "DatePickerField");
    await act(async () => { renderer!.root.findByProps({ accessibilityLabel: "Filter by Date, collapsed" }).props.onPress(); });
    await act(async () => { pickers()[0].props.onChange("2026-11-20"); });
    await act(async () => { pickers()[1].props.onChange("2026-11-10"); });
    expect(renderer!.root.findAll(node => node.props.accessibilityRole === "alert").length).toBe(1);
  });
});
