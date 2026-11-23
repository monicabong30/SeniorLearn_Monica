export type CalendarEnrollment = { status: string; class?: { _id: string; startsAt: string; status?: string } };

export const dayKey = (value: string | Date) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const monthCells = (month: Date) => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1), days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (start.getDay() + 6) % 7;
  return Array.from({ length: offset + days }, (_, index) => index < offset ? null : new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
};
export const activeEnrolments = (rows: CalendarEnrollment[]) => rows.filter(row => row.status === 'ACTIVE' && row.class?.status !== 'CANCELLED');
export const enrolmentsOnDay = (rows: CalendarEnrollment[], key: string) => activeEnrolments(rows).filter(row => dayKey(row.class!.startsAt) === key);
