import { useMemo } from "react";

const stable = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
export const formSubmitState = <T,>({initialValues,values,validate,normalize,isSubmitting=false,mode}:{initialValues:T;values:T;validate:(values:T)=>Record<string,string>;normalize?:(values:T)=>T;isSubmitting?:boolean;mode:"create"|"edit"}) => {
  const errors=validate(values),isDirty=stable(normalize?normalize(values):values)!==stable(normalize?normalize(initialValues):initialValues),isValid=Object.keys(errors).length===0;
  return {errors,isDirty,isValid,canSubmit:isValid&&!isSubmitting&&(mode==="create"||isDirty)};
};

/** Shared submit gate for independent create and edit form instances. */
export function useFormSubmitState<T>({ initialValues, values, validate, normalize, isSubmitting = false, mode }: { initialValues: T; values: T; validate: (values: T) => Record<string, string>; normalize?: (values: T) => T; isSubmitting?: boolean; mode: "create" | "edit" }) {
  return useMemo(() => {
    return formSubmitState({initialValues,values,validate,normalize,isSubmitting,mode});
  }, [initialValues, values, validate, normalize, isSubmitting, mode]);
}
