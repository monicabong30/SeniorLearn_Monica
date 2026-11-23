"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const index_js_1 = require("../models/index.js");
const auth_js_1 = require("../middleware/auth.js");
const http_js_1 = require("../utils/http.js");
const domain_js_1 = require("../services/domain.js");
const membership_js_1 = require("../services/membership.js");
const recurrence_js_1 = require("../utils/recurrence.js");
const classChanges_js_1 = require("../utils/classChanges.js");
const recurrenceSeries_js_1 = require("../services/recurrenceSeries.js");
const r = (0, express_1.Router)();
const userSafe = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, dateOfBirth: u.dateOfBirth, roles: (0, index_js_1.userRoles)(u), isAdmin: (0, index_js_1.isAdmin)(u), communicationsOptInYear: u.communicationsOptInYear });
// Date of birth is profile information and deliberately optional at registration.
// User.createdAt is the authoritative server-side registration timestamp.
const register = zod_1.z.object({ name: zod_1.z.string().trim().min(2), email: zod_1.z.string().trim().email(), password: zod_1.z.string().min(8), phone: zod_1.z.string().trim().min(6), communicationsOptIn: zod_1.z.boolean().optional() });
r.post('/auth/register', (0, http_js_1.asyncRoute)(async (req, res) => { const input = register.parse(req.body); const session = await mongoose_1.default.startSession(); let user; try {
    await session.withTransaction(async () => { const now = new Date(), expires = new Date(now); expires.setFullYear(expires.getFullYear() + 1); const [created] = await index_js_1.User.create([{ name: input.name, email: input.email.toLowerCase(), phone: input.phone, passwordHash: await bcrypt_1.default.hash(input.password, 12), roles: ['STANDARD'], communicationsOptInYear: input.communicationsOptIn ? now.getFullYear() : undefined }], { session }); user = created; await index_js_1.Membership.create([{ user: user._id, startsAt: now, expiresAt: expires }], { session }); await index_js_1.Payment.create([{ user: user._id, amountCents: 5000, kind: 'REGISTRATION', status: 'SIMULATED_PAID', reference: `SIM-${Date.now()}` }], { session }); await (0, domain_js_1.notify)(String(user._id), 'Welcome to SeniorLearn', 'Your standard membership registration is confirmed.', 'MEMBERSHIP', session); });
}
finally {
    await session.endSession();
} const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }); res.status(201).json({ token, user: userSafe(user) }); }));
r.post('/auth/login', (0, http_js_1.asyncRoute)(async (req, res) => { const input = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) }).parse(req.body); const user = await index_js_1.User.findOne({ email: input.email }).select('+passwordHash'); if (!user || !await bcrypt_1.default.compare(input.password, user.passwordHash))
    return res.status(401).json({ error: 'Email or password is incorrect' }); const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }); res.json({ token, user: userSafe(user) }); }));
r.get('/me', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const [u, m] = await Promise.all([index_js_1.User.findById(req.auth.id), index_js_1.Membership.findOne({ user: req.auth.id })]); await (0, membership_js_1.renewalReminder)(u, m); res.json({ user: userSafe(u), membership: m, effectiveStatus: (0, membership_js_1.effectiveMembershipStatus)(u, m) }); }));
r.put('/me', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const input = zod_1.z.object({ name: zod_1.z.string().min(2).optional(), phone: zod_1.z.string().min(6).optional(), dateOfBirth: zod_1.z.coerce.date().optional(), communicationsOptIn: zod_1.z.boolean().optional() }).parse(req.body); const update = {}; for (const key of ['name', 'phone', 'dateOfBirth'])
    if (input[key] !== undefined)
        update[key] = input[key]; if (input.communicationsOptIn !== undefined)
    update.communicationsOptInYear = input.communicationsOptIn ? new Date().getFullYear() : undefined; const user = await index_js_1.User.findByIdAndUpdate(req.auth.id, update, { new: true }); res.json({ user: userSafe(user) }); }));
r.put('/me/email', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const input = zod_1.z.object({ email: zod_1.z.string().email(), currentPassword: zod_1.z.string().min(1) }).parse(req.body); const user = await index_js_1.User.findById(req.auth.id).select('+passwordHash'); if (!user || !await bcrypt_1.default.compare(input.currentPassword, user.passwordHash))
    return res.status(401).json({ error: 'Current password is incorrect' }); const email = input.email.toLowerCase(); if (email !== user.email && await index_js_1.User.exists({ email }))
    return res.status(409).json({ error: 'An account already uses this email address' }); user.email = email; await user.save(); res.json({ user: userSafe(user) }); }));
r.put('/me/password', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const input = zod_1.z.object({ currentPassword: zod_1.z.string().min(1), newPassword: zod_1.z.string().min(8) }).parse(req.body); const user = await index_js_1.User.findById(req.auth.id).select('+passwordHash'); if (!user || !await bcrypt_1.default.compare(input.currentPassword, user.passwordHash))
    return res.status(401).json({ error: 'Current password is incorrect' }); user.passwordHash = await bcrypt_1.default.hash(input.newPassword, 12); await user.save(); res.json({ message: 'Password updated' }); }));
async function renewalEligibility(user, membership) { const professional = (0, index_js_1.userRoles)(user).includes('PROFESSIONAL'), honorary = (0, index_js_1.userRoles)(user).includes('HONORARY'); if (honorary)
    return { type: 'HONORARY', lifetime: true, eligible: true, qualifyingClasses: 0, requiredClasses: 0, annualFeeCents: 0 }; if (!professional)
    return { type: 'STANDARD', lifetime: false, eligible: false, qualifyingClasses: 0, requiredClasses: 0, annualFeeCents: membership?.annualFeeCents ?? 5000 }; const after = new Date(); after.setUTCFullYear(after.getUTCFullYear() - 1); const qualifyingClasses = await index_js_1.LearningClass.countDocuments({ tutor: user._id, status: 'COMPLETE', startsAt: { $gte: after, $lte: new Date() } }); return { type: 'PROFESSIONAL', lifetime: false, eligible: qualifyingClasses >= 6, qualifyingClasses, requiredClasses: 6, annualFeeCents: membership?.annualFeeCents ?? 5000 }; }
r.get('/memberships/renewal-eligibility', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const membership = await index_js_1.Membership.findOne({ user: req.auth.id }); res.json({ membership, effectiveStatus: (0, membership_js_1.effectiveMembershipStatus)(req.user, membership), ...(await renewalEligibility(req.user, membership)) }); }));
r.post('/memberships/renew', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const user = req.user, session = await mongoose_1.default.startSession(); let result; try {
    await session.withTransaction(async () => { const membership = await index_js_1.Membership.findOne({ user: user._id }).session(session); if (!membership)
        throw Object.assign(new Error('Membership record is unavailable. Please contact SeniorLearn Support.'), { status: 403, code: 'MEMBERSHIP_UNAVAILABLE' }); if (membership.status === 'SUSPENDED')
        throw Object.assign(new Error('Your membership is suspended. Please contact SeniorLearn Administration.'), { status: 403, code: 'MEMBERSHIP_SUSPENDED' }); const eligibility = await renewalEligibility(user, membership); if (eligibility.lifetime) {
        result = { membership, free: true, lifetime: true, eligibility };
        return;
    } const free = eligibility.type === 'PROFESSIONAL' && eligibility.eligible; if (!free && req.body.simulatePayment !== true)
        throw Object.assign(new Error('Confirm the simulated assessment payment to renew.'), { status: 402, amountCents: membership.annualFeeCents }); const now = new Date(), duplicateSince = new Date(now.getTime() - 5 * 60 * 1000), duplicate = await index_js_1.Notification.findOne({ user: user._id, type: 'MEMBERSHIP_RENEWED', createdAt: { $gte: duplicateSince } }).session(session); if (duplicate) {
        result = { membership, free, lifetime: false, duplicate: true, eligibility };
        return;
    } const oldExpiry = new Date(membership.expiresAt || 0), base = oldExpiry > now ? oldExpiry : now, expiresAt = new Date(base); expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1); membership.startsAt = now; membership.expiresAt = expiresAt; membership.status = 'ACTIVE'; if (eligibility.type === 'PROFESSIONAL' && !free)
        user.roles = ['STANDARD']; await membership.save({ session }); if (!free)
        await index_js_1.Payment.create([{ user: user._id, amountCents: membership.annualFeeCents, kind: 'RENEWAL', status: 'SIMULATED_PAID', reference: `SIM-${Date.now()}` }], { session }); await (0, domain_js_1.notify)(String(user._id), 'Membership renewed', free ? 'Your complimentary Professional membership has been renewed.' : 'Your simulated assessment payment was successful.', 'MEMBERSHIP_RENEWED', session); if (eligibility.type === 'PROFESSIONAL' && !free)
        await user.save({ session }); result = { membership, free, lifetime: false, eligibility: { ...eligibility, convertedToStandard: eligibility.type === 'PROFESSIONAL' && !free } }; });
}
finally {
    await session.endSession();
} res.json(result); }));
r.use(['/classes', '/enrollments', '/favourites', '/bulletins', '/recurrences'], auth_js_1.auth, auth_js_1.requireActiveMembership);
const classFields = zod_1.z.object({ title: zod_1.z.string().min(3), description: zod_1.z.string().min(10), startsAt: zod_1.z.coerce.date(), durationMinutes: zod_1.z.number().int().min(15), capacity: zod_1.z.number().int().min(1), delivery: zod_1.z.enum(['ONLINE', 'ON_PREMISES']), teamsLink: zod_1.z.string().url().optional(), address: zod_1.z.string().min(5).optional(), materials: zod_1.z.array(zod_1.z.string()).default([]), prerequisites: zod_1.z.string().optional(), status: zod_1.z.enum(['DRAFT', 'SCHEDULED']).default('DRAFT') });
const validateDelivery = (v, c) => { if (v.delivery === 'ONLINE' && !v.teamsLink)
    c.addIssue({ code: 'custom', message: 'Teams link required' }); if (v.delivery === 'ON_PREMISES' && !v.address)
    c.addIssue({ code: 'custom', message: 'Address required' }); };
const classInput = classFields.superRefine(validateDelivery);
const classPatch = classFields.partial();
async function conflict(tutor, startsAt, durationMinutes, exclude) { const sessions = await index_js_1.LearningClass.find({ tutor, status: { $in: ['DRAFT', 'SCHEDULED', 'CLOSED'] }, _id: { $ne: exclude } }); return sessions.some((x) => (0, domain_js_1.overlaps)(startsAt, durationMinutes, x.startsAt, x.durationMinutes)); }
r.get('/classes', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const mine = req.query.mine === 'true' && ((0, index_js_1.userRoles)(req.user).includes('PROFESSIONAL') || (0, auth_js_1.hasAdminAccess)(req.user)); const q = mine ? { tutor: req.auth.id } : { status: { $in: ['SCHEDULED', 'CLOSED'] } }; if (req.query.search)
    q.$or = [{ title: { $regex: req.query.search, $options: 'i' } }, { description: { $regex: req.query.search, $options: 'i' } }]; if (req.query.delivery)
    q.delivery = req.query.delivery; res.json(await index_js_1.LearningClass.find(q).populate('tutor', 'name').sort({ startsAt: 1 })); }));
r.get('/classes/:id', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.LearningClass.findById(req.params.id).populate('tutor', 'name email'); if (!item)
    return res.status(404).json({ error: 'Class not found' }); res.json({ class: item, enrollmentCount: await (0, domain_js_1.activeEnrollmentCount)(item.id) }); }));
r.post('/classes', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const v = classInput.parse(req.body); if (await conflict(req.auth.id, v.startsAt, v.durationMinutes))
    return res.status(409).json({ error: 'This overlaps one of your scheduled classes' }); const item = await index_js_1.LearningClass.create({ ...v, tutor: req.auth.id }); res.status(201).json(item); }));
r.put('/classes/:id', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.LearningClass.findById(req.params.id); if (!item)
    return res.status(404).json({ error: 'Class not found' }); if (String(item.tutor) !== req.auth.id && !(0, auth_js_1.hasAdminAccess)(req.user))
    return res.status(403).json({ error: 'Only the tutor may update this class' }); if (item.startsAt <= new Date())
    return res.status(409).json({ error: 'Started classes cannot be changed' }); const before = item.toObject(), v = classPatch.parse(req.body), validated = classInput.parse({ ...before, ...v }); if (await conflict(String(item.tutor), validated.startsAt, validated.durationMinutes, item.id))
    return res.status(409).json({ error: 'This overlaps one of this tutor’s scheduled classes' }); Object.assign(item, v); const changes = (0, classChanges_js_1.meaningfulClassChanges)(before, item.toObject()); if (changes.length) {
    item.version = (item.version || 1) + 1;
    await item.save();
    await index_js_1.ClassChange.create({ class: item._id, version: item.version, changes });
    const favourites = await index_js_1.Favourite.find({ class: item._id });
    await Promise.all(favourites.map(f => (0, domain_js_1.notify)(String(f.user), 'Favourite class updated', `${item.title} has changed.`, 'FAVOURITE_CLASS_UPDATED')));
}
else
    await item.save(); const enrolled = await index_js_1.Enrollment.find({ class: item._id, status: 'ACTIVE' }); await Promise.all(enrolled.map(e => (0, domain_js_1.notify)(String(e.user), 'Class updated', `${item.title} has been updated. ${req.body.changeReason || ''}`, 'CLASS_UPDATED'))); res.json(item); }));
r.post('/classes/:id/publish', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.LearningClass.findById(req.params.id); if (!item)
    return res.status(404).json({ error: 'Class not found' }); if (String(item.tutor) !== req.auth.id && !(0, auth_js_1.hasAdminAccess)(req.user))
    return res.status(403).json({ error: 'Not your class' }); if (item.status !== 'DRAFT')
    return res.status(409).json({ error: 'Only drafts can be published' }); item.status = 'SCHEDULED'; await item.save(); res.json(item); }));
r.post('/classes/:id/cancel', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.LearningClass.findById(req.params.id); if (!item)
    return res.status(404).json({ error: 'Class not found' }); if (String(item.tutor) !== req.auth.id && !(0, auth_js_1.hasAdminAccess)(req.user))
    return res.status(403).json({ error: 'Not your class' }); if (item.status !== 'CANCELLED') {
    const before = item.toObject();
    item.status = 'CANCELLED';
    item.version = (item.version || 1) + 1;
    await item.save();
    await index_js_1.ClassChange.create({ class: item._id, version: item.version, changes: (0, classChanges_js_1.meaningfulClassChanges)(before, item.toObject()) });
    const favourites = await index_js_1.Favourite.find({ class: item._id });
    await Promise.all(favourites.map(f => (0, domain_js_1.notify)(String(f.user), 'Favourite class cancelled', `${item.title} has been cancelled.`, 'FAVOURITE_CLASS_UPDATED')));
} const rows = await index_js_1.Enrollment.find({ class: item._id, status: 'ACTIVE' }); await Promise.all(rows.map(e => (0, domain_js_1.notify)(String(e.user), 'Class cancelled', `${item.title} has been cancelled.`, 'CLASS_CANCELLED'))); res.json(item); }));
r.post('/classes/:id/enrollments', auth_js_1.auth, (0, auth_js_1.permit)('STANDARD', 'PROFESSIONAL', 'HONORARY'), (0, http_js_1.asyncRoute)(async (req, res) => { const session = await mongoose_1.default.startSession(); let enrollment, item; try {
    await session.withTransaction(async () => { item = await index_js_1.LearningClass.findById(req.params.id).session(session); if (!item)
        throw Object.assign(new Error('Class not found'), { status: 404 }); if (item.startsAt <= new Date())
        throw Object.assign(new Error('Class has already started'), { status: 409 }); if (item.status !== 'SCHEDULED')
        throw Object.assign(new Error(item.status === 'CLOSED' ? 'Class is full' : 'Class is not open for enrolment'), { status: 409 }); if (await index_js_1.Enrollment.exists({ user: req.auth.id, class: item._id, status: 'ACTIVE' }).session(session))
        throw Object.assign(new Error('You are already enrolled in this class.'), { status: 409 }); const count = await index_js_1.Enrollment.countDocuments({ class: item._id, status: 'ACTIVE' }).session(session); if (count >= item.capacity) {
        item.status = 'CLOSED';
        await item.save({ session });
        throw Object.assign(new Error('Class is full'), { status: 409 });
    } const created = await index_js_1.Enrollment.create([{ user: req.auth.id, class: item._id, status: 'ACTIVE' }], { session }); enrollment = created[0]; if (count + 1 >= item.capacity) {
        item.status = 'CLOSED';
        await item.save({ session });
    } });
    await (0, domain_js_1.notify)(req.auth.id, 'Enrolment confirmed', `You are enrolled in ${item.title}.`, 'ENROLLMENT');
    res.status(201).json(enrollment);
}
finally {
    await session.endSession();
} }));
r.get('/enrollments', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => res.json(await index_js_1.Enrollment.find({ user: req.auth.id }).populate({ path: 'class', populate: { path: 'tutor', select: 'name' } }).sort({ createdAt: -1 }))));
r.get('/favourites', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const rows = await index_js_1.Favourite.find({ user: req.auth.id }).populate({ path: 'class', populate: { path: 'tutor', select: 'name' } }).sort({ createdAt: -1 }); res.json(await Promise.all(rows.filter(x => x.class).map(async (row) => ({ ...row.toObject(), updates: await index_js_1.ClassChange.find({ class: row.class, version: { $gt: row.seenVersion } }).sort({ version: 1 }) })))); }));
r.get('/favourites/:classId', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const favourite = await index_js_1.Favourite.findOne({ user: req.auth.id, class: req.params.classId }); res.json({ favourited: !!favourite, favourite, updates: favourite ? await index_js_1.ClassChange.find({ class: req.params.classId, version: { $gt: favourite.seenVersion } }).sort({ version: 1 }) : [] }); }));
r.post('/favourites', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.LearningClass.findById(req.body.classId); if (!item)
    return res.status(404).json({ error: 'Class not found' }); const existing = await index_js_1.Favourite.findOne({ user: req.auth.id, class: item._id }); if (existing)
    return res.status(409).json({ error: 'Class is already in Favourites' }); res.status(201).json(await index_js_1.Favourite.create({ user: req.auth.id, class: item._id, seenVersion: item.version || 1 })); }));
r.put('/favourites/:classId/seen', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.LearningClass.findById(req.params.classId); const favourite = await index_js_1.Favourite.findOneAndUpdate({ user: req.auth.id, class: req.params.classId }, { seenVersion: item?.version || 1 }, { new: true }); if (!favourite)
    return res.status(404).json({ error: 'Favourite not found' }); res.json(favourite); }));
r.delete('/favourites/:classId', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const favourite = await index_js_1.Favourite.findOneAndDelete({ user: req.auth.id, class: req.params.classId }); if (!favourite)
    return res.status(404).json({ error: 'Favourite not found' }); res.status(204).end(); }));
r.delete('/enrollments/:classId', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const e = await index_js_1.Enrollment.findOneAndUpdate({ user: req.auth.id, class: req.params.classId, status: 'ACTIVE' }, { status: 'CANCELLED' }, { new: true }); if (!e)
    return res.status(404).json({ error: 'Active enrolment not found' }); await (0, domain_js_1.refreshCapacityStatus)(req.params.classId); res.status(204).end(); }));
r.post('/classes/recurring', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const input = classFields.extend({ frequency: zod_1.z.enum(['WEEKLY', 'BIWEEKLY', 'CUSTOM']), weekdays: zod_1.z.array(zod_1.z.number().int().min(0).max(6)).default([]), endDate: zod_1.z.coerce.date() }).superRefine(validateDelivery).parse(req.body); const dates = (0, recurrence_js_1.generateOccurrences)(input.startsAt, input.endDate, input.frequency, input.weekdays); for (const d of dates)
    if (await conflict(req.auth.id, d, input.durationMinutes))
        return res.status(409).json({ error: `Scheduling conflict on ${d.toDateString()}` }); const seriesId = crypto.randomUUID(); const classes = await index_js_1.LearningClass.insertMany(dates.map((startsAt, occurrenceIndex) => ({ ...input, startsAt, tutor: req.auth.id, recurrenceSeriesId: seriesId, occurrenceIndex }))); await index_js_1.RecurrenceRule.create({ seriesId, tutor: req.auth.id, frequency: input.frequency, weekdays: input.weekdays, endDate: input.endDate, classIds: classes.map(x => x._id) }); res.status(201).json({ seriesId, occurrences: classes }); }));
r.put('/recurrences/:seriesId/:occurrenceId', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const scope = zod_1.z.enum(['SINGLE', 'FUTURE', 'ALL']).parse(req.body.scope); const seed = await index_js_1.LearningClass.findById(req.params.occurrenceId); if (!seed || seed.recurrenceSeriesId !== req.params.seriesId)
    return res.status(404).json({ error: 'Occurrence not found' }); if (String(seed.tutor) !== req.auth.id && !(0, auth_js_1.hasAdminAccess)(req.user))
    return res.status(403).json({ error: 'Only the tutor or administrator may update this series' }); const series = await index_js_1.LearningClass.find({ recurrenceSeriesId: req.params.seriesId }); const affected = (0, recurrenceSeries_js_1.affectedOccurrences)(series, req.params.seriesId, seed.id, scope); const patch = classPatch.parse(req.body); for (const item of affected) {
    Object.assign(item, patch);
    await item.save();
    const enrolled = await index_js_1.Enrollment.find({ class: item._id, status: 'ACTIVE' });
    await Promise.all(enrolled.map(e => (0, domain_js_1.notify)(String(e.user), 'Class updated', `${item.title} has been updated.`, 'CLASS_UPDATED')));
} res.json({ updated: affected.map(x => x._id) }); }));
r.post('/recurrences/:seriesId/:occurrenceId/cancel', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const scope = zod_1.z.enum(['SINGLE', 'FUTURE', 'ALL']).parse(req.body.scope); const seed = await index_js_1.LearningClass.findById(req.params.occurrenceId); if (!seed || seed.recurrenceSeriesId !== req.params.seriesId)
    return res.status(404).json({ error: 'Occurrence not found' }); if (String(seed.tutor) !== req.auth.id && !(0, auth_js_1.hasAdminAccess)(req.user))
    return res.status(403).json({ error: 'Only the tutor or administrator may cancel this series' }); const series = await index_js_1.LearningClass.find({ recurrenceSeriesId: req.params.seriesId }); const affected = (0, recurrenceSeries_js_1.cancelOccurrences)(series, req.params.seriesId, seed.id, scope); for (const item of affected) {
    await item.save();
    const enrolled = await index_js_1.Enrollment.find({ class: item._id, status: 'ACTIVE' });
    await Promise.all(enrolled.map(e => (0, domain_js_1.notify)(String(e.user), 'Class cancelled', `${item.title} has been cancelled.`, 'CLASS_CANCELLED')));
} res.json({ cancelled: affected.map(x => x._id) }); }));
r.get('/classes/:id/roster', auth_js_1.auth, (0, auth_js_1.permit)('PROFESSIONAL', 'ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.LearningClass.findById(req.params.id); if (!item)
    return res.status(404).json({ error: 'Class not found' }); if (String(item.tutor) !== req.auth.id && !(0, auth_js_1.hasAdminAccess)(req.user))
    return res.status(403).json({ error: 'Only the tutor or administrator may view this roster' }); const rows = await index_js_1.Enrollment.find({ class: item._id }).populate('user', 'name email'); res.json({ capacity: item.capacity, count: rows.filter(x => x.status === 'ACTIVE').length, enrollments: rows }); }));
r.post('/admin/classes/:id/enrollments', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const input = zod_1.z.object({ userId: zod_1.z.string().min(1) }).parse(req.body); const member = await index_js_1.User.findById(input.userId); if (!member || (0, index_js_1.isAdmin)(member) || !(0, index_js_1.userRoles)(member).includes('STANDARD'))
    return res.status(404).json({ error: 'Eligible member not found' }); const membership = await index_js_1.Membership.findOne({ user: member._id }); if ((0, membership_js_1.effectiveMembershipStatus)(member, membership) !== 'ACTIVE')
    return res.status(409).json({ error: 'This member does not have an active membership' }); const session = await mongoose_1.default.startSession(); try {
    let enrollment;
    await session.withTransaction(async () => { const item = await index_js_1.LearningClass.findById(req.params.id).session(session); if (!item)
        throw Object.assign(new Error('Class not found'), { status: 404 }); if (item.startsAt <= new Date())
        throw Object.assign(new Error('Class has already started'), { status: 409 }); if (item.status !== 'SCHEDULED')
        throw Object.assign(new Error(item.status === 'CLOSED' ? 'Class is full' : 'Class is not open for enrolment'), { status: 409 }); if (await index_js_1.Enrollment.exists({ user: member._id, class: item._id, status: 'ACTIVE' }).session(session))
        throw Object.assign(new Error('Member is already enrolled in this class.'), { status: 409 }); const count = await index_js_1.Enrollment.countDocuments({ class: item._id, status: 'ACTIVE' }).session(session); if (count >= item.capacity) {
        item.status = 'CLOSED';
        await item.save({ session });
        throw Object.assign(new Error('Class is full'), { status: 409 });
    } enrollment = (await index_js_1.Enrollment.create([{ user: member._id, class: item._id, status: 'ACTIVE' }], { session }))[0]; if (count + 1 >= item.capacity) {
        item.status = 'CLOSED';
        await item.save({ session });
    } });
    await (0, domain_js_1.notify)(String(member._id), 'Enrolment confirmed', `You are enrolled in ${(await index_js_1.LearningClass.findById(req.params.id))?.title || 'a class'}.`, 'ENROLLMENT');
    res.status(201).json(enrollment);
}
finally {
    await session.endSession();
} }));
r.delete('/admin/classes/:classId/enrollments/:userId', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const enrollment = await index_js_1.Enrollment.findOneAndUpdate({ class: req.params.classId, user: req.params.userId, status: 'ACTIVE' }, { status: 'CANCELLED', cancelledAt: new Date() }, { new: true }); if (!enrollment)
    return res.status(404).json({ error: 'Active enrolment not found' }); await (0, domain_js_1.refreshCapacityStatus)(req.params.classId); await (0, domain_js_1.notify)(req.params.userId, 'Enrolment cancelled', 'An administrator cancelled your class enrolment.', 'CLASS_CANCELLED'); res.status(204).end(); }));
// Dashboard data stays on the server: this avoids downloading member/class collections
// solely to derive analytics in the client. Month keys use UTC consistently.
const analyticsDate = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const analyticsQuery = zod_1.z.object({ membershipStart: analyticsDate, membershipEnd: analyticsDate, classStart: analyticsDate, classEnd: analyticsDate });
function analyticsRange(start, end) {
    const now = new Date(), defaultStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)), defaultEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const from = start ? new Date(`${start}T00:00:00.000Z`) : defaultStart, to = end ? new Date(`${end}T00:00:00.000Z`) : defaultEnd;
    if (Number.isNaN(+from) || Number.isNaN(+to) || from > to)
        throw Object.assign(new Error('Start Date must be on or before End Date.'), { status: 400 });
    const exclusive = new Date(to);
    exclusive.setUTCDate(exclusive.getUTCDate() + 1);
    const daily = (exclusive.getTime() - from.getTime()) / 86400000 <= 62, keys = [];
    for (let d = new Date(from); d < exclusive; daily ? d.setUTCDate(d.getUTCDate() + 1) : d.setUTCMonth(d.getUTCMonth() + 1))
        keys.push(daily ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7));
    return { from, exclusive, keys, format: daily ? '%Y-%m-%d' : '%Y-%m' };
}
r.get('/admin/overview', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => {
    const input = analyticsQuery.parse(req.query), membership = analyticsRange(input.membershipStart, input.membershipEnd), classesRange = analyticsRange(input.classStart, input.classEnd);
    const projectRoles = { $setUnion: [{ $ifNull: ['$roles', []] }, { $cond: [{ $eq: ['$role', 'PROFESSIONAL'] }, ['PROFESSIONAL'], { $cond: [{ $eq: ['$role', 'HONORARY'] }, ['HONORARY'], []] }] }, ['STANDARD']] };
    const [members, classes, bulletins, roleRows, registrationRows, statusRows, activityRows] = await Promise.all([
        index_js_1.User.countDocuments(), index_js_1.LearningClass.countDocuments(), index_js_1.Bulletin.countDocuments({ status: 'PUBLISHED' }),
        index_js_1.User.aggregate([{ $match: { createdAt: { $type: 'date', $gte: membership.from, $lt: membership.exclusive } } }, { $project: { createdAt: 1, roles: projectRoles } }, { $unwind: '$roles' }, { $group: { _id: { key: { $dateToString: { format: membership.format, date: '$createdAt', timezone: 'UTC' } }, role: '$roles' }, count: { $sum: 1 } } }]),
        index_js_1.User.aggregate([{ $match: { createdAt: { $type: 'date', $gte: membership.from, $lt: membership.exclusive } } }, { $group: { _id: { $dateToString: { format: membership.format, date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } }]),
        index_js_1.LearningClass.aggregate([{ $match: { startsAt: { $type: 'date', $gte: classesRange.from, $lt: classesRange.exclusive } } }, { $group: { _id: { key: { $dateToString: { format: classesRange.format, date: '$startsAt', timezone: 'UTC' } }, status: '$status' }, count: { $sum: 1 } } }]),
        index_js_1.LearningClass.aggregate([{ $match: { startsAt: { $type: 'date', $gte: classesRange.from, $lt: classesRange.exclusive } } }, { $group: { _id: { $dateToString: { format: classesRange.format, date: '$startsAt', timezone: 'UTC' } }, count: { $sum: 1 } } }])
    ]);
    const series = (rows, keys, field, values) => values.map(value => ({ name: value, points: keys.map(key => ({ key, count: rows.find(row => row._id.key === key && row._id[field] === value)?.count || 0 })) }));
    res.json({ members, classes, bulletins, timezone: 'UTC', membership: { keys: membership.keys, granularity: membership.format, roleSeries: series(roleRows, membership.keys, 'role', ['STANDARD', 'PROFESSIONAL', 'HONORARY']), registrations: membership.keys.map(key => ({ key, count: registrationRows.find(row => row._id === key)?.count || 0 })) }, classesAnalytics: { keys: classesRange.keys, granularity: classesRange.format, statusSeries: series(statusRows, classesRange.keys, 'status', ['DRAFT', 'SCHEDULED', 'CLOSED', 'COMPLETE', 'CANCELLED']), activity: classesRange.keys.map(key => ({ key, count: activityRows.find(row => row._id === key)?.count || 0 })) } });
}));
r.get('/admin/tutors', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (_req, res) => {
    const historical = await index_js_1.LearningClass.distinct('tutor');
    // Canonical roles are authoritative when present; the legacy field is used
    // only for records that predate the multi-role migration.
    const tutors = await index_js_1.User.find({ $or: [{ roles: 'PROFESSIONAL' }, { roles: { $exists: false }, role: 'PROFESSIONAL' }, { _id: { $in: historical } }] }).select('name').sort({ name: 1 }).lean();
    res.json(tutors.map(tutor => ({ id: String(tutor._id), name: tutor.name })));
}));
r.get('/admin/classes', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const q = {}; if (req.query.status)
    q.status = req.query.status; if (req.query.tutorId && mongoose_1.default.isValidObjectId(req.query.tutorId))
    q.tutor = req.query.tutorId; if (req.query.search)
    q.$or = [{ title: { $regex: req.query.search, $options: 'i' } }, { description: { $regex: req.query.search, $options: 'i' } }]; const classes = await index_js_1.LearningClass.find(q).populate('tutor', 'name').sort({ startsAt: 1 }).lean(); const counts = await index_js_1.Enrollment.aggregate([{ $match: { status: 'ACTIVE', class: { $in: classes.map(item => item._id) } } }, { $group: { _id: '$class', count: { $sum: 1 } } }]); const byClass = new Map(counts.map(item => [String(item._id), item.count])); res.json(classes.map(item => ({ ...item, enrollmentCount: byClass.get(String(item._id)) || 0 }))); }));
const dateRange = (start, end) => { if (typeof start === 'string' && typeof end === 'string' && start > end)
    return undefined; const range = {}; if (typeof start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(start))
    range.$gte = new Date(`${start}T00:00:00.000Z`); if (typeof end === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
    const next = new Date(`${end}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    range.$lt = next;
} return Object.keys(range).length ? range : undefined; };
r.get('/admin/members', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const range = dateRange(req.query.startDate, req.query.endDate); const registration = req.query.dateType === 'Registration Date'; const renewal = req.query.dateType === 'Membership Renewal Date'; const q = req.query.search ? { $or: [{ name: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }] } : {}; if (range && registration)
    q.createdAt = range; if (range && renewal) {
    const matched = await index_js_1.Membership.find({ expiresAt: range }).select('user').lean();
    q._id = { $in: matched.map(membership => membership.user) };
} const users = await index_js_1.User.find(q).sort({ name: 1 }).lean(); const memberships = await index_js_1.Membership.find({ user: { $in: users.map(user => user._id) } }).lean(); const byUser = new Map(memberships.map(membership => [String(membership.user), membership])); res.json(users.map(user => ({ ...userSafe(user), membership: byUser.get(String(user._id)) || null }))); }));
r.get('/admin/members/:id', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const [user, membership, payments] = await Promise.all([index_js_1.User.findById(req.params.id), index_js_1.Membership.findOne({ user: req.params.id }), index_js_1.Payment.find({ user: req.params.id }).sort({ createdAt: -1 })]); if (!user)
    return res.status(404).json({ error: 'Member not found' }); res.json({ user: userSafe(user), membership, payments }); }));
const memberUpdate = zod_1.z.object({ roles: zod_1.z.array(zod_1.z.enum(['STANDARD', 'PROFESSIONAL', 'HONORARY'])).min(1), status: zod_1.z.enum(['ACTIVE', 'EXPIRED', 'PENDING', 'SUSPENDED']), expiresAt: zod_1.z.coerce.date() });
r.put('/admin/members/:id', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const input = memberUpdate.parse(req.body), roles = (0, index_js_1.normalizeRoles)(input.roles); if (roles.length !== new Set(input.roles).size || !input.roles.includes('STANDARD'))
    return res.status(400).json({ error: 'STANDARD membership is required and roles must be unique' }); const target = await index_js_1.User.findById(req.params.id); if (!target)
    return res.status(404).json({ error: 'Member not found' }); if ((0, index_js_1.isAdmin)(target))
    return res.status(403).json({ error: 'Administrator accounts cannot be changed through member management' }); const session = await mongoose_1.default.startSession(); let membership; try {
    await session.withTransaction(async () => { membership = await index_js_1.Membership.findOneAndUpdate({ user: target._id }, { status: input.status, expiresAt: input.expiresAt }, { new: true, session }); if (!membership)
        throw Object.assign(new Error('Membership not found'), { status: 404 }); target.roles = roles; await target.save({ session }); });
}
finally {
    await session.endSession();
} res.json({ user: userSafe(target), membership }); }));
r.put('/admin/members/:id/role', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const input = zod_1.z.object({ roles: zod_1.z.array(zod_1.z.enum(['STANDARD', 'PROFESSIONAL', 'HONORARY'])).min(1) }).parse(req.body); const roles = (0, index_js_1.normalizeRoles)(input.roles); if (roles.length !== new Set(input.roles).size || !input.roles.includes('STANDARD'))
    return res.status(400).json({ error: 'STANDARD membership is required and roles must be unique' }); const target = await index_js_1.User.findById(req.params.id); if (!target)
    return res.status(404).json({ error: 'Member not found' }); if ((0, index_js_1.isAdmin)(target))
    return res.status(403).json({ error: 'Administrator accounts cannot be changed through member management' }); const user = await index_js_1.User.findByIdAndUpdate(req.params.id, { roles }, { new: true }); res.json({ user: userSafe(user) }); }));
r.put('/admin/members/:id/membership', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { const input = zod_1.z.object({ status: zod_1.z.enum(['ACTIVE', 'EXPIRED', 'PENDING']).optional(), expiresAt: zod_1.z.coerce.date().optional() }).refine(value => value.status !== undefined || value.expiresAt !== undefined, { message: 'Provide membership information to update' }).parse(req.body); const target = await index_js_1.User.findById(req.params.id); if (!target)
    return res.status(404).json({ error: 'Member not found' }); if ((0, index_js_1.isAdmin)(target))
    return res.status(403).json({ error: 'Administrator accounts cannot be changed through member management' }); const membership = await index_js_1.Membership.findOneAndUpdate({ user: req.params.id }, input, { new: true }); if (!membership)
    return res.status(404).json({ error: 'Membership not found' }); res.json({ membership }); }));
r.get('/bulletins', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const q = (0, auth_js_1.hasAdminAccess)(req.user) ? {} : { status: 'PUBLISHED' }; const range = dateRange(req.query.startDate, req.query.endDate); if (range && (0, auth_js_1.hasAdminAccess)(req.user)) {
    if (req.query.dateType === 'Created Date')
        q.createdAt = range;
    if (req.query.dateType === 'Published Date')
        q.publishedAt = range;
} const items = await index_js_1.Bulletin.find(q).populate('author', 'name').sort({ publishedAt: -1 }); const reads = await index_js_1.BulletinRead.find({ user: req.auth.id, bulletin: { $in: items.map(item => item._id) } }).select('bulletin readAt'); const byBulletin = new Map(reads.map(read => [String(read.bulletin), read.readAt])); res.json(items.map(item => ({ ...item.toObject(), readAt: byBulletin.get(item.id) || null }))); }));
r.get('/bulletins/:id', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.Bulletin.findOne({ _id: req.params.id, ...((0, auth_js_1.hasAdminAccess)(req.user) ? {} : { status: 'PUBLISHED' }) }).populate('author', 'name'); if (!item)
    return res.status(404).json({ error: 'Bulletin not found' }); const read = await index_js_1.BulletinRead.findOne({ user: req.auth.id, bulletin: item._id }).select('readAt'); res.json({ ...item.toObject(), readAt: read?.readAt || null }); }));
r.put('/bulletins/:id/read', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const item = await index_js_1.Bulletin.findOne({ _id: req.params.id, ...((0, auth_js_1.hasAdminAccess)(req.user) ? {} : { status: 'PUBLISHED' }) }); if (!item)
    return res.status(404).json({ error: 'Bulletin not found' }); const read = await index_js_1.BulletinRead.findOneAndUpdate({ user: req.auth.id, bulletin: item._id }, { $set: { readAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ bulletin: item.id, readAt: read.readAt }); }));
r.post('/bulletins', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => res.status(201).json(await index_js_1.Bulletin.create({ ...zod_1.z.object({ title: zod_1.z.string().min(3), body: zod_1.z.string().min(10) }).parse(req.body), author: req.auth.id }))));
r.put('/bulletins/:id', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => res.json(await index_js_1.Bulletin.findByIdAndUpdate(req.params.id, zod_1.z.object({ title: zod_1.z.string().min(3).optional(), body: zod_1.z.string().min(10).optional() }).parse(req.body), { new: true }))));
r.post('/bulletins/:id/publish', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => res.json(await index_js_1.Bulletin.findByIdAndUpdate(req.params.id, { status: 'PUBLISHED', publishedAt: new Date() }, { new: true }))));
r.delete('/bulletins/:id', auth_js_1.auth, (0, auth_js_1.permit)('ADMIN'), (0, http_js_1.asyncRoute)(async (req, res) => { await index_js_1.Bulletin.findByIdAndDelete(req.params.id); res.status(204).end(); }));
r.get('/notifications', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => res.json(await index_js_1.Notification.find({ user: req.auth.id }).sort({ createdAt: -1 }))));
r.put('/notifications/:id/read', auth_js_1.auth, (0, http_js_1.asyncRoute)(async (req, res) => { const notification = await index_js_1.Notification.findOneAndUpdate({ _id: req.params.id, user: req.auth.id }, { readAt: new Date() }, { new: true }); if (!notification)
    return res.status(404).json({ error: 'Notification not found' }); res.json(notification); }));
exports.default = r;
