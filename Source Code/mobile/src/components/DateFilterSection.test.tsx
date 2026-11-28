import React, { useState } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
vi.mock("react-native", () => ({ Platform:{select:<T,>(x:{default:T})=>x.default}, Modal:"Modal", Pressable:"Pressable", ScrollView:"ScrollView", StyleSheet:{create:<T,>(x:T)=>x}, View:"View" }));
vi.mock("@expo/vector-icons", () => ({ Ionicons:"Ionicons" }));
vi.mock("./ScaledText", () => ({ ScaledText:"Text" })); vi.mock("./DatePickerField", () => ({ DatePickerField:"DatePickerField" })); vi.mock("./ui", () => ({ AppButton:"AppButton", Card:"Card" }));
import { DateFilterSection, type DateFilterValue } from "./DateFilterSection";
function Harness(){const [value,setValue]=useState<DateFilterValue>({type:"Created Date",startDate:"",endDate:""});return <DateFilterSection types={["Created Date","Published Date"]} value={value} onChange={setValue}/>}
function CustomHarness(){const [value,setValue]=useState<DateFilterValue>({type:"Created Date",startDate:"2026-06-10",endDate:"2026-06-20",label:"Custom"});return <DateFilterSection types={["Created Date","Published Date"]} value={value} onChange={setValue}/>}
describe("DateFilterSection",()=>{it("uses the shared modal",async()=>{let tree:ReturnType<typeof create>;await act(async()=>{tree=create(<Harness/>)});await act(async()=>{tree!.root.findAllByProps({accessibilityRole:"button"})[0].props.onPress()});expect(tree!.root.find(node=>String(node.type)==="Modal").props.visible).toBe(true)});it("constrains custom calendars to the other selected date",async()=>{let tree:ReturnType<typeof create>;await act(async()=>{tree=create(<CustomHarness/>)});await act(async()=>{tree!.root.findAllByProps({accessibilityRole:"button"})[0].props.onPress()});const fields=tree!.root.findAll(node=>String(node.type)==="DatePickerField");expect(fields[0].props.maximumDate).toBe("2026-06-20");expect(fields[1].props.minimumDate).toBe("2026-06-10")})});
