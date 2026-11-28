import { Schema, model, Types } from 'mongoose';

export type MembershipRole = 'STANDARD' | 'PROFESSIONAL' | 'HONORARY';
/** Role is retained as the legacy on-disk representation during the transition. */
export type Role = MembershipRole | 'ADMIN';
export const membershipRoles: MembershipRole[] = ['STANDARD', 'PROFESSIONAL', 'HONORARY'];
export function normalizeRoles(value: unknown, legacy?: unknown): MembershipRole[] {
  const supplied = Array.isArray(value) ? value : [];
  const accepted = supplied.filter((role): role is MembershipRole => typeof role === 'string' && membershipRoles.includes(role as MembershipRole));
  // A legacy role is used only when there is no canonical value. Invalid canonical data
  // therefore fails closed to STANDARD rather than gaining a capability.
  // Mongoose may materialize an omitted array as []; treat that the same as a
  // missing canonical field so pre-backfill legacy records retain access.
  const source = accepted.length ? accepted : legacy === 'PROFESSIONAL' ? ['PROFESSIONAL'] : legacy === 'HONORARY' ? ['HONORARY'] : [];
  return [...new Set<MembershipRole>(['STANDARD', ...(source.filter(role => role !== 'STANDARD') as MembershipRole[])])];
}
export function userRoles(user: any): MembershipRole[] { return normalizeRoles(user?.roles, user?.role); }
export function isAdmin(user: any): boolean { return user?.isAdmin === true || user?.role === 'ADMIN'; }
export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }, phone: String, dateOfBirth: Date, profilePhotoUrl: String,
  termsVersion: String, termsAcceptedAt: Date,
  // Keep role to read existing records. New writes use roles/isAdmin.
  role: { type: String, enum: ['STANDARD','PROFESSIONAL','HONORARY','ADMIN'], default: 'STANDARD' },
  roles: { type: [{ type: String, enum: ['STANDARD','PROFESSIONAL','HONORARY'] }], default: undefined,
    validate: { validator: (roles: string[] | undefined) => !roles || (new Set(roles).size === roles.length && roles.every(role => membershipRoles.includes(role as MembershipRole)) && roles.includes('STANDARD')), message: 'Invalid membership roles' } },
  isAdmin: { type: Boolean, default: false }, communicationsOptInYear: Number, transactionalEmailOptIn: { type: Boolean, default: true }
}, { timestamps: true }));
export const Membership = model('Membership', new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, status: { type: String, enum: ['ACTIVE','EXPIRED','PENDING','SUSPENDED'], default: 'PENDING' }, startsAt: Date, expiresAt: Date, annualFeeCents: { type: Number, default: 5000 } }, { timestamps: true }));
export const Course = model('Course', new Schema({ title: { type: String, required: true }, description: String, tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, enrollmentMode: { type: String, enum: ['COURSE','OCCURRENCE'], default: 'OCCURRENCE' } }, { timestamps: true }));
const classSchema = new Schema({ title: { type: String, required: true, trim: true }, description: { type: String, required: true }, tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, course: { type: Schema.Types.ObjectId, ref: 'Course' }, startsAt: { type: Date, required: true }, durationMinutes: { type: Number, required: true, min: 15 }, capacity: { type: Number, required: true, min: 1 }, status: { type: String, enum: ['DRAFT','SCHEDULED','CLOSED','COMPLETE','CANCELLED'], default: 'DRAFT' }, delivery: { type: String, enum: ['ONLINE','ON_PREMISES'], required: true }, teamsLink: String, teamsCode: String, meetingDetails: String, joiningInstructions: String, address: String, locationDetails: String, accessibilityInfo: String, mapUrl: String, materials: [String], prerequisites: String, recurrenceSeriesId: String, occurrenceIndex: Number, version: { type: Number, default: 1 } }, { timestamps: true });
classSchema.index({ tutor: 1, startsAt: 1 }); classSchema.index({ status: 1, startsAt: 1 });
export const LearningClass = model('LearningClass', classSchema);
export const RecurrenceRule = model('RecurrenceRule', new Schema({ seriesId: { type: String, unique: true, required: true }, tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, frequency: { type: String, enum: ['WEEKLY','BIWEEKLY','CUSTOM'], required: true }, weekdays: [Number], endDate: Date, classIds: [{ type: Schema.Types.ObjectId, ref: 'LearningClass' }], status: { type: String, enum: ['DRAFT','SCHEDULED','CLOSED','COMPLETE','CANCELLED'], default: 'DRAFT' } }, { timestamps: true }));
const enrollmentSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, class: { type: Schema.Types.ObjectId, ref: 'LearningClass', required: true }, status: { type: String, enum: ['ACTIVE','CANCELLED'], default: 'ACTIVE' }, cancelledAt: Date }, { timestamps: true });
// Cancelled rows are retained as history. Only an active row is unique, so a member can re-enrol after cancellation.
enrollmentSchema.index({ user: 1, class: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' }, name: 'active_enrollment_per_user_class' });
enrollmentSchema.index({ class: 1, status: 1 });
export const Enrollment = model('Enrollment', enrollmentSchema);
const paymentSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, amountCents: Number, kind: { type: String, enum: ['REGISTRATION','RENEWAL'], required: true }, status: { type: String, enum: ['PENDING','PAID','FAILED','CANCELLED'], required: true }, provider: { type: String, default: 'DEMO_PAYMENT' }, providerReference: { type: String, unique: true, sparse: true }, checkoutSessionId: { type: String, unique: true, sparse: true }, reference: String, renewalPeriod: String }, { timestamps: true });
// One unpaid checkout attempt is allowed per renewal period; failed/cancelled attempts may be retried.
paymentSchema.index({ user: 1, kind: 1, renewalPeriod: 1 }, { unique: true, partialFilterExpression: { kind: 'RENEWAL', status: 'PENDING', renewalPeriod: { $type: 'string' } }, name: 'one_pending_renewal_payment_per_period' });
export const Payment = model('Payment', paymentSchema);
export const Bulletin = model('Bulletin', new Schema({ title: { type: String, required: true }, body: { type: String, required: true }, status: { type: String, enum: ['DRAFT','PUBLISHED'], default: 'DRAFT' }, author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, publishedAt: Date }, { timestamps: true }));
const bulletinReadSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, bulletin: { type: Schema.Types.ObjectId, ref: 'Bulletin', required: true }, readAt: { type: Date, required: true } }, { timestamps: true });
bulletinReadSchema.index({ user: 1, bulletin: 1 }, { unique: true });
export const BulletinRead = model('BulletinRead', bulletinReadSchema);
const notificationSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, title: String, body: String, readAt: Date, type: String, entity: { kind: String, id: String, label: String } }, { timestamps: true });
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
export const Notification = model('Notification', notificationSchema);
const favouriteSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, class: { type: Schema.Types.ObjectId, ref: 'LearningClass', required: true }, seenVersion: { type: Number, required: true, default: 1 } }, { timestamps: true });
favouriteSchema.index({ user: 1, class: 1 }, { unique: true });
export const Favourite = model('Favourite', favouriteSchema);
export const ClassChange = model('ClassChange', new Schema({ class: { type: Schema.Types.ObjectId, ref: 'LearningClass', required: true }, version: { type: Number, required: true }, changes: [{ field: String, previous: Schema.Types.Mixed, current: Schema.Types.Mixed }] }, { timestamps: true })); ClassChange.schema.index({ class: 1, version: 1 }, { unique: true });
export const Setting = model('Setting', new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed }, { timestamps: true }));
