import { describe, expect, it } from 'vitest';
import { recurringSeriesStatus } from './recurringSeriesStatus.js';

describe('recurringSeriesStatus', () => {
  it('keeps a partly completed series scheduled', () => expect(recurringSeriesStatus([{status:'COMPLETE'},{status:'SCHEDULED'}])).toBe('SCHEDULED'));
  it('only completes when all non-cancelled occurrences are complete', () => expect(recurringSeriesStatus([{status:'COMPLETE'},{status:'CANCELLED'}])).toBe('COMPLETE'));
  it('recognises wholly draft and cancelled series', () => { expect(recurringSeriesStatus([{status:'DRAFT'},{status:'DRAFT'}])).toBe('DRAFT'); expect(recurringSeriesStatus([{status:'CANCELLED'}])).toBe('CANCELLED'); });
});
