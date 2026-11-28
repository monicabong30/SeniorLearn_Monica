import { LearningClass } from '../models/index.js';

/** Idempotently complete elapsed, non-cancelled sessions. Invoke from scheduled jobs and reads. */
export async function completeElapsedClasses(now = new Date()) {
  return LearningClass.updateMany({ status: { $in: ['SCHEDULED', 'CLOSED'] }, startsAt: { $lte: now } }, { $set: { status: 'COMPLETE' } });
}
