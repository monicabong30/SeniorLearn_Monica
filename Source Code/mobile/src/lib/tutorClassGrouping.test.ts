import { describe, expect, it } from 'vitest';
import { groupTutorClasses, seriesStatusSummary } from './tutorClassGrouping';
const row = (id:string, seriesId?:string, status='DRAFT') => ({ _id:id, recurrenceSeriesId:seriesId, status, title:'Same title', startsAt:`2027-01-0${id.slice(-1)}T10:00:00.000Z`, durationMinutes:60, capacity:10 });
describe('Tutor dashboard class grouping', () => {
  it('groups only matching recurrence identifiers and leaves single classes separate', () => {
    const items=groupTutorClasses([row('a','one'),row('b','one'),row('c','two'),row('d')],'ALL','ALL');
    expect(items).toHaveLength(3); expect(items.filter(x=>'kind' in x)).toHaveLength(2);
  });
  it('filters a series by its authoritative overall status', () => {
    const items=groupTutorClasses([row('a','one','DRAFT'),row('b','one','SCHEDULED'),row('c')],'RECURRING','SCHEDULED');
    expect(items).toHaveLength(1); expect(seriesStatusSummary((items[0] as any).items)).toBe('SCHEDULED');
  });
});
