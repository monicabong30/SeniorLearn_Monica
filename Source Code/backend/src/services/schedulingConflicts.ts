import { Types } from 'mongoose';
import { LearningClass } from '../models/index.js';

export type ProposedClass = { _id?: string; title: string; tutor: string; startsAt: Date; durationMinutes: number };
const blockingStatuses = ['DRAFT', 'SCHEDULED', 'CLOSED'];

export const endsAt = (item: Pick<ProposedClass, 'startsAt' | 'durationMinutes'>) =>
  new Date(item.startsAt.getTime() + item.durationMinutes * 60_000);

/** Half-open intervals make adjoining classes valid: [10:00,11:00) and [11:00,12:00). */
export const intervalsOverlap = (a: Pick<ProposedClass, 'startsAt' | 'durationMinutes'>, b: Pick<ProposedClass, 'startsAt' | 'durationMinutes'>) =>
  a.startsAt < endsAt(b) && endsAt(a) > b.startsAt;

export type ScheduleConflict = { proposed: ProposedClass; existing: { _id: string; title: string; startsAt: Date; durationMinutes: number } };
export const conflictMessage = ({ existing }: ScheduleConflict) => {
  const start = new Date(existing.startsAt), end = endsAt(existing);
  const date = start.toLocaleDateString('en-AU', { timeZone: 'UTC' });
  const time = (value: Date) => value.toLocaleTimeString('en-AU', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
  return `Schedule conflict with ${existing.title} on ${date}, ${time(start)} – ${time(end)}.`;
};

/** Finds conflicts both inside a proposed batch and against active schedules for that tutor. */
export async function findScheduleConflict(proposed: ProposedClass[], excludeIds: string[] = []): Promise<ScheduleConflict | undefined> {
  for (const item of proposed) {
    if (!Number.isFinite(item.durationMinutes) || item.durationMinutes <= 0) throw Object.assign(new Error('End time must be later than start time.'), { status: 400 });
  }
  for (let i = 0; i < proposed.length; i++) for (let j = 0; j < i; j++) {
    if (proposed[i].tutor === proposed[j].tutor && intervalsOverlap(proposed[i], proposed[j])) return { proposed: proposed[i], existing: { _id: proposed[j]._id || 'proposed', title: proposed[j].title, startsAt: proposed[j].startsAt, durationMinutes: proposed[j].durationMinutes } };
  }
  const tutorIds = [...new Set(proposed.map(x => x.tutor))].map(id => new Types.ObjectId(id));
  const ignored = [...excludeIds, ...proposed.map(x => x._id).filter(Boolean) as string[]];
  const rows = await LearningClass.find({ tutor: { $in: tutorIds }, status: { $in: blockingStatuses }, _id: { $nin: ignored } }).select('title tutor startsAt durationMinutes').lean();
  for (const item of proposed) for (const existing of rows as any[]) {
    if (String(existing.tutor) === item.tutor && intervalsOverlap(item, existing)) return { proposed: item, existing: { _id: String(existing._id), title: existing.title, startsAt: existing.startsAt, durationMinutes: existing.durationMinutes } };
  }
  return undefined;
}
