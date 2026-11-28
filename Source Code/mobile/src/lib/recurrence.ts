export type RecurrenceFrequency = 'WEEKLY' | 'BIWEEKLY';

/** Mirrors the server recurrence calculation using date-only local values. */
export function recurringDates(firstDate: string, lastDate: string, frequency: RecurrenceFrequency): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDate) || !/^\d{4}-\d{2}-\d{2}$/.test(lastDate)) return [];
  const start = new Date(`${firstDate}T12:00:00`), end = new Date(`${lastDate}T12:00:00`);
  if (Number.isNaN(+start) || Number.isNaN(+end) || end < start) return [];
  const result: string[] = [], step = frequency === 'WEEKLY' ? 7 : 14;
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + step)) result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  return result;
}

/** Returns the inclusive final occurrence date for a requested series length. */
export function recurrenceEndDate(firstDate: string, occurrences: number, frequency: RecurrenceFrequency): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDate) || !Number.isInteger(occurrences) || occurrences < 1) return '';
  const date = new Date(`${firstDate}T12:00:00`);
  if (Number.isNaN(+date)) return '';
  date.setDate(date.getDate() + (occurrences - 1) * (frequency === 'WEEKLY' ? 7 : 14));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
