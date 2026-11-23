import { describe, expect, it } from 'vitest';
import { activeEnrolments, dayKey, enrolmentsOnDay, monthCells } from './calendar';
describe('learning calendar', () => {
  it('generates Monday-first month cells and crosses years', () => { const november = monthCells(new Date(2026, 10, 1)); expect(november.slice(0, 6)).toEqual([null, null, null, null, null, null]); expect(november[6]?.getDate()).toBe(1); expect(monthCells(new Date(2026, 11, 1)).at(-1)?.getFullYear()).toBe(2026); });
  it('uses local calendar days and only active enrolled occurrences', () => { const rows:any[]=[{status:'ACTIVE',class:{_id:'a',startsAt:'2027-01-04T10:00:00.000Z',status:'SCHEDULED'}},{status:'CANCELLED',class:{_id:'b',startsAt:'2027-01-04T11:00:00.000Z'}},{status:'ACTIVE',class:{_id:'c',startsAt:'2027-01-11T10:00:00.000Z',status:'SCHEDULED'}}]; expect(dayKey('2027-01-04T10:00:00.000Z')).toBe('2027-01-04'); expect(enrolmentsOnDay(rows,'2027-01-04')).toHaveLength(1); expect(activeEnrolments(rows)).toHaveLength(2); });
});
