import { describe, expect, it } from "vitest";
import { formSubmitState } from "./useFormSubmitState";

type Values={role:string;expiresAt:string};
const validate=(v:Values):Record<string,string>=>v.role?{}:{role:"Required"};
const base={role:"PROFESSIONAL",expiresAt:"2027-11-16"};
describe("formSubmitState",()=>{
 it("keeps an unchanged edit form disabled",()=>expect(formSubmitState({initialValues:base,values:{...base},validate,mode:"edit"}).canSubmit).toBe(false));
 it("enables a valid normalized edit and disables it after a revert",()=>{const changed=formSubmitState({initialValues:base,values:{...base,expiresAt:"2027-11-20"},validate,mode:"edit"});expect(changed.canSubmit).toBe(true);expect(formSubmitState({initialValues:base,values:base,validate,mode:"edit"}).isDirty).toBe(false);});
 it("does not treat formatting-only changes as dirty when normalized",()=>expect(formSubmitState({initialValues:{title:" Hello "},values:{title:"Hello"},validate:()=>({}),normalize:v=>({title:v.title.trim()}),mode:"edit"}).isDirty).toBe(false));
 it("blocks invalid and pending submissions",()=>{expect(formSubmitState({initialValues:base,values:{...base,role:""},validate,mode:"edit"}).canSubmit).toBe(false);expect(formSubmitState({initialValues:base,values:{...base,expiresAt:"2027-11-20"},validate,mode:"edit",isSubmitting:true}).canSubmit).toBe(false);});
 it("allows a valid create form without an edit baseline",()=>expect(formSubmitState({initialValues:base,values:base,validate,mode:"create"}).canSubmit).toBe(true));
 it("treats an equivalent role set in a different order as unchanged",()=>expect(formSubmitState({initialValues:{roles:["STANDARD","PROFESSIONAL","HONORARY"]},values:{roles:["HONORARY","STANDARD","PROFESSIONAL"]},validate:()=>({}),normalize:v=>({roles:[...v.roles].sort()}),mode:"edit"}).isDirty).toBe(false));
});
