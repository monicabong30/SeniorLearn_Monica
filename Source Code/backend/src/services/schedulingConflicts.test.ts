import { describe, expect, it } from 'vitest';
import { intervalsOverlap } from './schedulingConflicts.js';

const slot = (time:string, durationMinutes:number) => ({ startsAt:new Date(`2027-01-01T${time}:00.000Z`), durationMinutes });
describe('scheduling conflicts', () => {
  it('allows different times and back-to-back intervals', () => {
    expect(intervalsOverlap(slot('10:00', 60), slot('09:00', 60))).toBe(false);
    expect(intervalsOverlap(slot('10:00', 60), slot('11:00', 60))).toBe(false);
  });
  it('detects partial, equal, and contained intervals', () => {
    expect(intervalsOverlap(slot('10:00', 60), slot('09:30', 60))).toBe(true);
    expect(intervalsOverlap(slot('10:00', 60), slot('10:00', 60))).toBe(true);
    expect(intervalsOverlap(slot('10:00', 60), slot('10:15', 30))).toBe(true);
  });
});
