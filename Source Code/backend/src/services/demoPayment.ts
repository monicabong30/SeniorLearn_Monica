import mongoose from 'mongoose';
import { Membership, Notification, Payment } from '../models/index.js';

/** Local demonstration payment provider; it is never a real payment processor. */
export async function settleDemoPayment(payment: any) {
  const session = await mongoose.startSession();
  try { await session.withTransaction(async () => {
    const stored = await Payment.findById(payment._id).session(session);
    if (!stored || stored.status !== 'PENDING') return;
    const membership = await Membership.findOne({ user: stored.user }).session(session);
    if (!membership) throw Object.assign(new Error('Membership not found.'), { status: 404 });
    const now = new Date(), base = stored.kind === 'RENEWAL' && membership.expiresAt && membership.expiresAt > now ? membership.expiresAt : now, expiresAt = new Date(base);
    expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
    membership.status = 'ACTIVE'; membership.startsAt = now; membership.expiresAt = expiresAt;
    stored.status = 'PAID'; stored.providerReference = `demo-${stored._id}`;
    await Promise.all([membership.save({ session }), stored.save({ session })]);
    await Notification.create([{ user: stored.user, title: stored.kind === 'RENEWAL' ? 'Membership renewed' : 'Membership activated', body: 'Your demonstration payment was approved.', type: 'PAYMENT_CONFIRMED' }], { session });
  }); } finally { await session.endSession(); }
  return Payment.findById(payment._id);
}
