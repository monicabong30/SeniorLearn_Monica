/** @deprecated Use DateFilterModal directly. Retained as a compatibility wrapper. */
import { DateFilterModal, type DateFilterValue } from "./DateFilterModal";
export type { DateFilterValue } from "./DateFilterModal";
export function DateFilterSection({types,value,onChange}:{types:readonly string[];value:DateFilterValue;onChange:(value:DateFilterValue)=>void;showTypes?:boolean}) { return <DateFilterModal types={types} value={value} onChange={onChange}/>; }
