export type SeriesOccurrence = { status: string };

/** The one public lifecycle state for a recurring course. */
export function recurringSeriesStatus(rows: SeriesOccurrence[]): string {
  const statuses = rows.map(row => row.status);
  if (!statuses.length || statuses.every(status => status === 'DRAFT')) return 'DRAFT';
  if (statuses.every(status => status === 'CANCELLED')) return 'CANCELLED';
  const unfinished = statuses.filter(status => !['COMPLETE', 'CANCELLED'].includes(status));
  if (!unfinished.length && statuses.includes('COMPLETE')) return 'COMPLETE';
  if (!statuses.includes('SCHEDULED')) return 'CLOSED';
  return 'SCHEDULED';
}
