"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setting = exports.ClassChange = exports.Favourite = exports.Notification = exports.BulletinRead = exports.Bulletin = exports.Payment = exports.Enrollment = exports.RecurrenceRule = exports.LearningClass = exports.Course = exports.Membership = exports.User = exports.membershipRoles = void 0;
exports.normalizeRoles = normalizeRoles;
exports.userRoles = userRoles;
exports.isAdmin = isAdmin;
const mongoose_1 = require("mongoose");
exports.membershipRoles = ['STANDARD', 'PROFESSIONAL', 'HONORARY'];
function normalizeRoles(value, legacy) {
    const supplied = Array.isArray(value) ? value : [];
    const accepted = supplied.filter((role) => typeof role === 'string' && exports.membershipRoles.includes(role));
    // A legacy role is used only when there is no canonical value. Invalid canonical data
    // therefore fails closed to STANDARD rather than gaining a capability.
    // Mongoose may materialize an omitted array as []; treat that the same as a
    // missing canonical field so pre-backfill legacy records retain access.
    const source = accepted.length ? accepted : legacy === 'PROFESSIONAL' ? ['PROFESSIONAL'] : legacy === 'HONORARY' ? ['HONORARY'] : [];
    return [...new Set(['STANDARD', ...source.filter(role => role !== 'STANDARD')])];
}
function userRoles(user) { return normalizeRoles(user?.roles, user?.role); }
function isAdmin(user) { return user?.isAdmin === true || user?.role === 'ADMIN'; }
exports.User = (0, mongoose_1.model)('User', new mongoose_1.Schema({
    name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false }, phone: String, dateOfBirth: Date,
    // Keep role to read existing records. New writes use roles/isAdmin.
    role: { type: String, enum: ['STANDARD', 'PROFESSIONAL', 'HONORARY', 'ADMIN'], default: 'STANDARD' },
    roles: { type: [{ type: String, enum: ['STANDARD', 'PROFESSIONAL', 'HONORARY'] }], default: undefined,
        validate: { validator: (roles) => !roles || (new Set(roles).size === roles.length && roles.every(role => exports.membershipRoles.includes(role)) && roles.includes('STANDARD')), message: 'Invalid membership roles' } },
    isAdmin: { type: Boolean, default: false }, communicationsOptInYear: Number
}, { timestamps: true }));
exports.Membership = (0, mongoose_1.model)('Membership', new mongoose_1.Schema({ user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'PENDING', 'SUSPENDED'], default: 'ACTIVE' }, startsAt: Date, expiresAt: Date, annualFeeCents: { type: Number, default: 5000 } }, { timestamps: true }));
exports.Course = (0, mongoose_1.model)('Course', new mongoose_1.Schema({ title: { type: String, required: true }, description: String, tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, enrollmentMode: { type: String, enum: ['COURSE', 'OCCURRENCE'], default: 'OCCURRENCE' } }, { timestamps: true }));
const classSchema = new mongoose_1.Schema({ title: { type: String, required: true, trim: true }, description: { type: String, required: true }, tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, course: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course' }, startsAt: { type: Date, required: true }, durationMinutes: { type: Number, required: true, min: 15 }, capacity: { type: Number, required: true, min: 1 }, status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'CLOSED', 'COMPLETE', 'CANCELLED'], default: 'DRAFT' }, delivery: { type: String, enum: ['ONLINE', 'ON_PREMISES'], required: true }, teamsLink: String, address: String, materials: [String], prerequisites: String, recurrenceSeriesId: String, occurrenceIndex: Number, version: { type: Number, default: 1 } }, { timestamps: true });
classSchema.index({ tutor: 1, startsAt: 1 });
classSchema.index({ status: 1, startsAt: 1 });
exports.LearningClass = (0, mongoose_1.model)('LearningClass', classSchema);
exports.RecurrenceRule = (0, mongoose_1.model)('RecurrenceRule', new mongoose_1.Schema({ seriesId: { type: String, unique: true, required: true }, tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, frequency: { type: String, enum: ['WEEKLY', 'BIWEEKLY', 'CUSTOM'], required: true }, weekdays: [Number], endDate: Date, classIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'LearningClass' }] }, { timestamps: true }));
const enrollmentSchema = new mongoose_1.Schema({ user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, class: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LearningClass', required: true }, status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' }, cancelledAt: Date }, { timestamps: true });
// Cancelled rows are retained as history. Only an active row is unique, so a member can re-enrol after cancellation.
enrollmentSchema.index({ user: 1, class: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' }, name: 'active_enrollment_per_user_class' });
enrollmentSchema.index({ class: 1, status: 1 });
exports.Enrollment = (0, mongoose_1.model)('Enrollment', enrollmentSchema);
exports.Payment = (0, mongoose_1.model)('Payment', new mongoose_1.Schema({ user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, amountCents: Number, kind: { type: String, enum: ['REGISTRATION', 'RENEWAL'], required: true }, status: { type: String, enum: ['SIMULATED_PAID', 'FAILED'], required: true }, reference: String }, { timestamps: true }));
exports.Bulletin = (0, mongoose_1.model)('Bulletin', new mongoose_1.Schema({ title: { type: String, required: true }, body: { type: String, required: true }, status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' }, author: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, publishedAt: Date }, { timestamps: true }));
const bulletinReadSchema = new mongoose_1.Schema({ user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, bulletin: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Bulletin', required: true }, readAt: { type: Date, required: true } }, { timestamps: true });
bulletinReadSchema.index({ user: 1, bulletin: 1 }, { unique: true });
exports.BulletinRead = (0, mongoose_1.model)('BulletinRead', bulletinReadSchema);
const notificationSchema = new mongoose_1.Schema({ user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, title: String, body: String, readAt: Date, type: String, entity: { kind: String, id: String, label: String } }, { timestamps: true });
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
const favouriteSchema = new mongoose_1.Schema({ user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, class: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LearningClass', required: true }, seenVersion: { type: Number, required: true, default: 1 } }, { timestamps: true });
favouriteSchema.index({ user: 1, class: 1 }, { unique: true });
exports.Favourite = (0, mongoose_1.model)('Favourite', favouriteSchema);
exports.ClassChange = (0, mongoose_1.model)('ClassChange', new mongoose_1.Schema({ class: { type: mongoose_1.Schema.Types.ObjectId, ref: 'LearningClass', required: true }, version: { type: Number, required: true }, changes: [{ field: String, previous: mongoose_1.Schema.Types.Mixed, current: mongoose_1.Schema.Types.Mixed }] }, { timestamps: true }));
exports.ClassChange.schema.index({ class: 1, version: 1 }, { unique: true });
exports.Setting = (0, mongoose_1.model)('Setting', new mongoose_1.Schema({ key: { type: String, unique: true }, value: mongoose_1.Schema.Types.Mixed }, { timestamps: true }));
