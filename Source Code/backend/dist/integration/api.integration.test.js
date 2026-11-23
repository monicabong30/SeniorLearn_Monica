"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
const vitest_1 = require("vitest");
const app_js_1 = __importStar(require("../app.js"));
const index_js_1 = require("../models/index.js");
const testDatabase_js_1 = require("./testDatabase.js");
const run = testDatabase_js_1.integrationEnabled ? vitest_1.describe : vitest_1.describe.skip;
const prefix = `integration-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const owned = { users: [], classes: [], bulletins: [] };
let server;
let baseUrl = '';
let tutorToken = '', memberToken = '', secondMemberToken = '', adminToken = '';
let tutorId = '', memberId = '', secondMemberId = '';
let classId = '';
async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}/api${path}`, { method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
}
async function register(email, name) {
    const response = await request('/auth/register', { method: 'POST', body: { name, email, password: 'SeniorLearn1!', phone: '0412345678' } });
    (0, vitest_1.expect)(response.status).toBe(201);
    owned.users.push(new mongoose_1.default.Types.ObjectId(response.body.user.id));
    return response.body;
}
const future = (days) => new Date(Date.now() + days * 86400000).toISOString();
const classInput = (overrides = {}) => ({ title: 'Digital photographs', description: 'Organise and safely share digital photographs.', startsAt: future(14), durationMinutes: 60, capacity: 2, delivery: 'ONLINE', teamsLink: 'https://teams.microsoft.com/example', ...overrides });
run('real MongoDB API integration', () => {
    (0, vitest_1.beforeAll)(async () => {
        const uri = (0, testDatabase_js_1.testDatabaseUri)();
        await mongoose_1.default.connect(uri);
        const db = mongoose_1.default.connection.db;
        await db.collection('enrollments').dropIndex('user_1_class_1').catch(() => undefined);
        await Promise.all([index_js_1.User.syncIndexes(), index_js_1.Membership.syncIndexes(), index_js_1.LearningClass.syncIndexes(), index_js_1.Enrollment.syncIndexes(), index_js_1.Favourite.syncIndexes(), index_js_1.Notification.syncIndexes(), index_js_1.BulletinRead.syncIndexes(), index_js_1.ClassChange.syncIndexes(), index_js_1.RecurrenceRule.syncIndexes()]);
        (0, vitest_1.expect)((await db.collection('enrollments').indexes()).some(index => index.name === 'user_1_class_1')).toBe(false);
        server = node_http_1.default.createServer(app_js_1.default);
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        const tutor = await register(`${prefix}-tutor@seniorlearn.test`, 'Integration Tutor');
        tutorId = tutor.user.id;
        await index_js_1.User.findByIdAndUpdate(tutorId, { roles: ['STANDARD', 'PROFESSIONAL'], isAdmin: false });
        tutorToken = (await request('/auth/login', { method: 'POST', body: { email: tutor.user.email, password: 'SeniorLearn1!' } })).body.token;
        const member = await register(`${prefix}-member@seniorlearn.test`, 'Integration Member');
        memberId = member.user.id;
        memberToken = member.token;
        const second = await register(`${prefix}-member2@seniorlearn.test`, 'Integration Member Two');
        secondMemberId = second.user.id;
        secondMemberToken = second.token;
        const admin = await register(`${prefix}-admin@seniorlearn.test`, 'Integration Admin');
        await index_js_1.User.findByIdAndUpdate(admin.user.id, { isAdmin: true });
        adminToken = (await request('/auth/login', { method: 'POST', body: { email: admin.user.email, password: 'SeniorLearn1!' } })).body.token;
    }, 30000);
    (0, vitest_1.afterAll)(async () => {
        const classIds = owned.classes;
        await Promise.all([index_js_1.Notification.deleteMany({ user: { $in: owned.users } }), index_js_1.BulletinRead.deleteMany({ user: { $in: owned.users } }), index_js_1.Favourite.deleteMany({ user: { $in: owned.users } }), index_js_1.Enrollment.deleteMany({ $or: [{ user: { $in: owned.users } }, { class: { $in: classIds } }] }), index_js_1.ClassChange.deleteMany({ class: { $in: classIds } }), index_js_1.RecurrenceRule.deleteMany({ tutor: { $in: owned.users } }), index_js_1.LearningClass.deleteMany({ $or: [{ _id: { $in: classIds } }, { tutor: { $in: owned.users } }] }), index_js_1.Bulletin.deleteMany({ _id: { $in: owned.bulletins } }), index_js_1.Payment.deleteMany({ user: { $in: owned.users } }), index_js_1.Membership.deleteMany({ user: { $in: owned.users } }), index_js_1.User.deleteMany({ _id: { $in: owned.users } })]);
        await new Promise(resolve => server?.close(() => resolve()));
        await mongoose_1.default.disconnect();
    });
    (0, vitest_1.it)('authenticates, persists profile changes, and never returns password hashes', async () => {
        (0, vitest_1.expect)((await request('/auth/login', { method: 'POST', body: { email: `${prefix}-member@seniorlearn.test`, password: 'wrong' } })).status).toBe(401);
        (0, vitest_1.expect)((await request('/me', { token: memberToken })).body.user.passwordHash).toBeUndefined();
        (0, vitest_1.expect)((await request('/me', { method: 'PUT', token: memberToken, body: { name: 'Persisted Member', phone: '0499999999' } })).status).toBe(200);
        (0, vitest_1.expect)((await index_js_1.User.findById(memberId).lean())?.name).toBe('Persisted Member');
        (0, vitest_1.expect)((await request('/me/password', { method: 'PUT', token: memberToken, body: { currentPassword: 'SeniorLearn1!', newPassword: 'Changed1!' } })).status).toBe(200);
        (0, vitest_1.expect)((await request('/auth/login', { method: 'POST', body: { email: `${prefix}-member@seniorlearn.test`, password: 'Changed1!' } })).status).toBe(200);
    });
    (0, vitest_1.it)('creates a complete standard registration without a date of birth', async () => {
        const email = `${prefix}-registration@seniorlearn.test`;
        const response = await request('/auth/register', { method: 'POST', body: { name: 'Registered Member', email, password: 'SeniorLearn1!', phone: '0412345678' } });
        (0, vitest_1.expect)(response.status).toBe(201);
        const user = await index_js_1.User.findById(response.body.user.id).select('+passwordHash').lean();
        owned.users.push(new mongoose_1.default.Types.ObjectId(response.body.user.id));
        (0, vitest_1.expect)(user?.roles).toEqual(['STANDARD']);
        (0, vitest_1.expect)(user?.dateOfBirth).toBeUndefined();
        (0, vitest_1.expect)(user?.createdAt).toBeInstanceOf(Date);
        (0, vitest_1.expect)(await bcrypt_1.default.compare('SeniorLearn1!', user.passwordHash)).toBe(true);
        (0, vitest_1.expect)(await index_js_1.Membership.findOne({ user: user._id, status: 'ACTIVE' })).toBeTruthy();
        (0, vitest_1.expect)(await index_js_1.Payment.findOne({ user: user._id, kind: 'REGISTRATION', status: 'SIMULATED_PAID' })).toBeTruthy();
        (0, vitest_1.expect)((await request('/auth/register', { method: 'POST', body: { name: 'Registered Member', email, password: 'SeniorLearn1!', phone: '0412345678' } })).status).toBe(409);
        (0, vitest_1.expect)((await request('/auth/register', { method: 'POST', body: { name: 'x', email: 'invalid', password: 'short', phone: 'x' } })).status).toBe(400);
    });
    (0, vitest_1.it)('filters admin members and bulletins by persisted dates using inclusive end dates', async () => {
        await index_js_1.User.collection.updateOne({ _id: new mongoose_1.default.Types.ObjectId(memberId) }, { $set: { createdAt: new Date('2026-11-20T23:59:59.999Z') } });
        await index_js_1.Membership.findOneAndUpdate({ user: memberId }, { expiresAt: new Date('2026-12-15T12:00:00.000Z') });
        const registration = await request('/admin/members?dateType=Registration%20Date&startDate=2026-11-20&endDate=2026-11-20', { token: adminToken });
        (0, vitest_1.expect)(registration.status).toBe(200);
        (0, vitest_1.expect)(registration.body.some((item) => item.id === memberId)).toBe(true);
        const renewal = await request('/admin/members?dateType=Membership%20Renewal%20Date&startDate=2026-12-15&endDate=2026-12-15', { token: adminToken });
        (0, vitest_1.expect)(renewal.body.some((item) => item.id === memberId)).toBe(true);
        const created = await index_js_1.Bulletin.create({ title: 'Created date bulletin', body: 'This bulletin verifies date filtering behaviour.', status: 'DRAFT', author: adminToken ? (await index_js_1.User.findOne({ isAdmin: true }))._id : undefined, createdAt: new Date('2026-11-10T10:00:00.000Z') });
        const published = await index_js_1.Bulletin.create({ title: 'Published date bulletin', body: 'This bulletin verifies publication date filtering.', status: 'PUBLISHED', author: (await index_js_1.User.findOne({ isAdmin: true }))._id, createdAt: new Date('2026-11-01T10:00:00.000Z'), publishedAt: new Date('2026-11-20T23:59:59.999Z') });
        owned.bulletins.push(created._id, published._id);
        const createdResults = await request('/bulletins?dateType=Created%20Date&startDate=2026-11-10&endDate=2026-11-10', { token: adminToken });
        (0, vitest_1.expect)(createdResults.body.map((item) => item._id)).toContain(String(created._id));
        const publishedResults = await request('/bulletins?dateType=Published%20Date&startDate=2026-11-20&endDate=2026-11-20', { token: adminToken });
        (0, vitest_1.expect)(publishedResults.body.map((item) => item._id)).toContain(String(published._id));
        (0, vitest_1.expect)(publishedResults.body.map((item) => item._id)).not.toContain(String(created._id));
    });
    (0, vitest_1.it)('persists tutor lifecycle, enrolment, cancellation, re-enrolment and roster access', async () => {
        const created = await request('/classes', { method: 'POST', token: tutorToken, body: classInput() });
        (0, vitest_1.expect)(created.status).toBe(201);
        classId = created.body._id;
        owned.classes.push(new mongoose_1.default.Types.ObjectId(classId));
        (0, vitest_1.expect)((await index_js_1.LearningClass.findById(classId).lean())?.status).toBe('DRAFT');
        (0, vitest_1.expect)((await request(`/classes/${classId}`, { method: 'PUT', token: tutorToken, body: { title: 'Updated digital photographs' } })).status).toBe(200);
        (0, vitest_1.expect)((await request(`/classes/${classId}/publish`, { method: 'POST', token: tutorToken })).status).toBe(200);
        (0, vitest_1.expect)((await request(`/classes/${classId}/enrollments`, { method: 'POST', token: memberToken })).status).toBe(201);
        (0, vitest_1.expect)((await request(`/classes/${classId}/enrollments`, { method: 'POST', token: memberToken })).status).toBe(409);
        (0, vitest_1.expect)((await request(`/classes/${classId}/roster`, { token: tutorToken })).body.count).toBe(1);
        (0, vitest_1.expect)((await request(`/classes/${classId}/roster`, { token: memberToken })).status).toBe(403);
        (0, vitest_1.expect)((await request(`/enrollments/${classId}`, { method: 'DELETE', token: memberToken })).status).toBe(204);
        (0, vitest_1.expect)((await request(`/classes/${classId}/enrollments`, { method: 'POST', token: memberToken })).status).toBe(201);
    });
    (0, vitest_1.it)('enforces final-seat capacity transactionally', async () => {
        const created = await request('/classes', { method: 'POST', token: tutorToken, body: classInput({ title: 'One place workshop', capacity: 1, startsAt: future(16) }) });
        (0, vitest_1.expect)(created.status).toBe(201);
        const id = created.body._id;
        owned.classes.push(new mongoose_1.default.Types.ObjectId(id));
        await request(`/classes/${id}/publish`, { method: 'POST', token: tutorToken });
        const results = await Promise.all([request(`/classes/${id}/enrollments`, { method: 'POST', token: memberToken }), request(`/classes/${id}/enrollments`, { method: 'POST', token: secondMemberToken })]);
        (0, vitest_1.expect)(results.map(result => result.status).sort()).toEqual([201, 409]);
        (0, vitest_1.expect)(await index_js_1.Enrollment.countDocuments({ class: id, status: 'ACTIVE' })).toBe(1);
    });
    (0, vitest_1.it)('lets only an administrator manage a class roster while preserving enrolment history', async () => {
        (0, vitest_1.expect)((await request(`/admin/classes/${classId}/enrollments`, { method: 'POST', token: memberToken, body: { userId: secondMemberId } })).status).toBe(403);
        (0, vitest_1.expect)((await request(`/admin/classes/${classId}/enrollments`, { method: 'POST', token: adminToken, body: { userId: secondMemberId } })).status).toBe(201);
        (0, vitest_1.expect)((await request(`/admin/classes/${classId}/enrollments`, { method: 'POST', token: adminToken, body: { userId: secondMemberId } })).status).toBe(409);
        (0, vitest_1.expect)((await request(`/classes/${classId}/roster`, { token: adminToken })).body.count).toBe(2);
        (0, vitest_1.expect)((await request(`/admin/classes/${classId}/enrollments/${secondMemberId}`, { method: 'DELETE', token: adminToken })).status).toBe(204);
        (0, vitest_1.expect)(await index_js_1.Enrollment.exists({ class: classId, user: secondMemberId, status: 'CANCELLED' })).toBeTruthy();
        (0, vitest_1.expect)((await request(`/classes/${classId}/roster`, { token: adminToken })).body.count).toBe(1);
    });
    (0, vitest_1.it)('persists weekly and biweekly recurrence scopes with their durations', async () => {
        for (const [frequency, start] of [['WEEKLY', future(30)], ['BIWEEKLY', future(60)]]) {
            const response = await request('/classes/recurring', { method: 'POST', token: tutorToken, body: { ...classInput({ title: `${frequency} integration series`, startsAt: start }), frequency, endDate: future(75), weekdays: [] } });
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.occurrences.length).toBeGreaterThan(1);
            (0, vitest_1.expect)(response.body.occurrences.every((item) => item.durationMinutes === 60)).toBe(true);
            owned.classes.push(...response.body.occurrences.map((item) => new mongoose_1.default.Types.ObjectId(item._id)));
            const selected = response.body.occurrences[0];
            (0, vitest_1.expect)((await request(`/recurrences/${response.body.seriesId}/${selected._id}`, { method: 'PUT', token: tutorToken, body: { scope: 'SINGLE', title: 'One changed occurrence' } })).status).toBe(200);
            (0, vitest_1.expect)((await request(`/recurrences/${response.body.seriesId}/${selected._id}/cancel`, { method: 'POST', token: tutorToken, body: { scope: 'FUTURE' } })).status).toBe(200);
        }
    });
    (0, vitest_1.it)('persists favourites, update notifications, notification read state, and admin bulletin lifecycle', async () => {
        (0, vitest_1.expect)((await request('/favourites', { method: 'POST', token: memberToken, body: { classId } })).status).toBe(201);
        (0, vitest_1.expect)((await request(`/classes/${classId}`, { method: 'PUT', token: tutorToken, body: { title: 'Changed again' } })).status).toBe(200);
        const notifications = await request('/notifications', { token: memberToken });
        (0, vitest_1.expect)(notifications.body.some((item) => item.type === 'FAVOURITE_CLASS_UPDATED')).toBe(true);
        const notice = notifications.body[0];
        (0, vitest_1.expect)((await request(`/notifications/${notice._id}/read`, { method: 'PUT', token: memberToken })).status).toBe(200);
        (0, vitest_1.expect)((await request(`/notifications/${notice._id}/read`, { method: 'PUT', token: secondMemberToken })).status).toBe(404);
        const bulletin = await request('/bulletins', { method: 'POST', token: adminToken, body: { title: 'Integration bulletin', body: 'Published through the real API.' } });
        (0, vitest_1.expect)(bulletin.status).toBe(201);
        owned.bulletins.push(new mongoose_1.default.Types.ObjectId(bulletin.body._id));
        (0, vitest_1.expect)((await request(`/bulletins/${bulletin.body._id}/publish`, { method: 'POST', token: adminToken })).status).toBe(200);
        (0, vitest_1.expect)((await request('/bulletins', { token: memberToken })).body.some((item) => item._id === bulletin.body._id)).toBe(true);
        (0, vitest_1.expect)((await request(`/admin/members/${secondMemberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'HONORARY'] } })).status).toBe(200);
        (0, vitest_1.expect)((await request('/admin/overview', { token: adminToken })).status).toBe(200);
        const allClasses = await request('/admin/classes', { token: adminToken });
        (0, vitest_1.expect)(allClasses.status).toBe(200);
        const tutorOptions = await request('/admin/tutors', { token: adminToken });
        (0, vitest_1.expect)(tutorOptions.status).toBe(200);
        (0, vitest_1.expect)(tutorOptions.body).toContainEqual({ id: tutorId, name: 'Integration Tutor' });
        const tutorClasses = await request(`/admin/classes?tutorId=${tutorId}`, { token: adminToken });
        (0, vitest_1.expect)(tutorClasses.status).toBe(200);
        (0, vitest_1.expect)(tutorClasses.body.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(tutorClasses.body.every((item) => String(item.tutor._id) === tutorId)).toBe(true);
        (0, vitest_1.expect)((await request('/admin/tutors', { token: memberToken })).status).toBe(403);
        (0, vitest_1.expect)((await request('/admin/members', { token: memberToken })).status).toBe(403);
        (0, vitest_1.expect)((await request(`/admin/members/${secondMemberId}/membership`, { method: 'PUT', token: adminToken, body: { status: 'PENDING' } })).status).toBe(200);
    });
    (0, vitest_1.it)('keeps bulletin read receipts private to each member', async () => {
        const bulletin = await request('/bulletins', { method: 'POST', token: adminToken, body: { title: 'Read receipt bulletin', body: 'Each member has their own persisted read state.' } });
        (0, vitest_1.expect)(bulletin.status).toBe(201);
        owned.bulletins.push(new mongoose_1.default.Types.ObjectId(bulletin.body._id));
        await request(`/bulletins/${bulletin.body._id}/publish`, { method: 'POST', token: adminToken });
        (0, vitest_1.expect)((await request('/bulletins', { token: memberToken })).body.find((item) => item._id === bulletin.body._id).readAt).toBeNull();
        (0, vitest_1.expect)((await request(`/bulletins/${bulletin.body._id}/read`, { method: 'PUT', token: memberToken })).status).toBe(200);
        (0, vitest_1.expect)((await request(`/bulletins/${bulletin.body._id}`, { token: memberToken })).body.readAt).toBeTruthy();
        (0, vitest_1.expect)((await request('/bulletins', { token: secondMemberToken })).body.find((item) => item._id === bulletin.body._id).readAt).toBeNull();
    });
    (0, vitest_1.it)('enforces canonical multi-role combinations and protects administrator authority', async () => {
        const cases = [
            { name: 'standard', roles: ['STANDARD'], tutorStatus: 403 },
            { name: 'professional', roles: ['STANDARD', 'PROFESSIONAL'], tutorStatus: 201 },
            { name: 'honorary', roles: ['STANDARD', 'HONORARY'], tutorStatus: 403 },
            { name: 'all-memberships', roles: ['STANDARD', 'PROFESSIONAL', 'HONORARY'], tutorStatus: 201 },
        ];
        for (const entry of cases) {
            const account = await register(`${prefix}-${entry.name}@seniorlearn.test`, `Role ${entry.name}`);
            const accountId = new mongoose_1.default.Types.ObjectId(account.user.id);
            owned.users.push(accountId);
            await index_js_1.User.findByIdAndUpdate(accountId, { roles: entry.roles, isAdmin: false });
            const token = (await request('/auth/login', { method: 'POST', body: { email: account.user.email, password: 'SeniorLearn1!' } })).body.token;
            const result = await request('/classes', { method: 'POST', token, body: classInput({ title: `Role ${entry.name} class`, startsAt: future(100 + cases.indexOf(entry)) }) });
            (0, vitest_1.expect)(result.status).toBe(entry.tutorStatus);
            if (result.status === 201)
                owned.classes.push(new mongoose_1.default.Types.ObjectId(result.body._id));
            (0, vitest_1.expect)((await request('/admin/overview', { token })).status).toBe(403);
        }
        (0, vitest_1.expect)((await request('/admin/overview', { token: adminToken })).status).toBe(200);
        (0, vitest_1.expect)((await request(`/admin/members/${memberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'ADMIN'] } })).status).toBe(400);
        (0, vitest_1.expect)((await request(`/admin/members/${memberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL'] } })).status).toBe(200);
        (0, vitest_1.expect)((await request(`/admin/members/${memberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD'] } })).status).toBe(200);
        const savedMember = await request(`/admin/members/${memberId}`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL', 'HONORARY'], status: 'PENDING', expiresAt: '2028-01-01' } });
        (0, vitest_1.expect)(savedMember.status).toBe(200);
        (0, vitest_1.expect)(savedMember.body.user.roles).toEqual(['STANDARD', 'PROFESSIONAL', 'HONORARY']);
        (0, vitest_1.expect)(savedMember.body.membership.status).toBe('PENDING');
        (0, vitest_1.expect)((await request(`/admin/members/${memberId}`, { method: 'GET', token: adminToken })).body.membership.expiresAt.slice(0, 10)).toBe('2028-01-01');
        (0, vitest_1.expect)((await request(`/admin/members/${(await index_js_1.User.findOne({ isAdmin: true }).lean())._id}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL'] } })).status).toBe(403);
        (0, vitest_1.expect)((await request(`/admin/members/${(await index_js_1.User.findOne({ isAdmin: true }).lean())._id}`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD'], status: 'PENDING', expiresAt: '2028-01-01' } })).status).toBe(403);
    });
    (0, vitest_1.it)('applies role grants and revocations to already-issued identity-only JWTs', async () => {
        const professional = await register(`${prefix}-stale-professional@seniorlearn.test`, 'Stale Professional');
        const professionalId = new mongoose_1.default.Types.ObjectId(professional.user.id);
        owned.users.push(professionalId);
        await index_js_1.User.findByIdAndUpdate(professionalId, { roles: ['STANDARD', 'PROFESSIONAL'] });
        const professionalToken = (await request('/auth/login', { method: 'POST', body: { email: professional.user.email, password: 'SeniorLearn1!' } })).body.token;
        (0, vitest_1.expect)((await request('/classes', { method: 'POST', token: professionalToken, body: classInput({ title: 'Before revocation', startsAt: future(110) }) })).status).toBe(201);
        (0, vitest_1.expect)((await request(`/admin/members/${professional.user.id}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD'] } })).status).toBe(200);
        (0, vitest_1.expect)((await request('/classes', { method: 'POST', token: professionalToken, body: classInput({ title: 'After revocation', startsAt: future(111) }) })).status).toBe(403);
        const standard = await register(`${prefix}-stale-standard@seniorlearn.test`, 'Stale Standard');
        const standardId = new mongoose_1.default.Types.ObjectId(standard.user.id);
        owned.users.push(standardId);
        const standardToken = standard.token;
        (0, vitest_1.expect)((await request('/classes', { method: 'POST', token: standardToken, body: classInput({ title: 'Before grant', startsAt: future(112) }) })).status).toBe(403);
        (0, vitest_1.expect)((await request(`/admin/members/${standard.user.id}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL'] } })).status).toBe(200);
        const granted = await request('/classes', { method: 'POST', token: standardToken, body: classInput({ title: 'After grant', startsAt: future(113) }) });
        (0, vitest_1.expect)(granted.status).toBe(201);
        owned.classes.push(new mongoose_1.default.Types.ObjectId(granted.body._id));
    });
    (0, vitest_1.it)('supports legacy singular role records without allowing them to override canonical roles', async () => {
        (0, app_js_1.resetLoginRateLimitForTests)();
        const passwordHash = await bcrypt_1.default.hash('SeniorLearn1!', 10);
        const legacy = async (suffix, role, roles) => {
            const created = await index_js_1.User.create({ name: `Legacy ${suffix}`, email: `${prefix}-legacy-${suffix}@seniorlearn.test`, passwordHash, role, ...(roles ? { roles } : {}) });
            owned.users.push(created._id);
            return { _id: created._id, email: `${prefix}-legacy-${suffix}@seniorlearn.test` };
        };
        const standard = await legacy('standard', 'STANDARD');
        const professional = await legacy('professional', 'PROFESSIONAL');
        const honorary = await legacy('honorary', 'HONORARY');
        const admin = await legacy('admin', 'ADMIN');
        const canonical = await legacy('canonical-wins', 'PROFESSIONAL', ['STANDARD']);
        const login = async (email) => (await request('/auth/login', { method: 'POST', body: { email, password: 'SeniorLearn1!' } })).body.token;
        (0, vitest_1.expect)((await request('/classes', { method: 'POST', token: await login(standard.email), body: classInput({ title: 'Legacy standard', startsAt: future(120) }) })).status).toBe(403);
        // Legacy records without a Membership record authenticate but cannot gain learning access.
        (0, vitest_1.expect)((await request('/classes', { method: 'POST', token: await login(professional.email), body: classInput({ title: 'Legacy professional', startsAt: future(121) }) })).status).toBe(403);
        (0, vitest_1.expect)((await request('/classes', { method: 'POST', token: await login(honorary.email), body: classInput({ title: 'Legacy honorary', startsAt: future(122) }) })).status).toBe(403);
        (0, vitest_1.expect)((await request('/admin/overview', { token: await login(admin.email) })).status).toBe(200);
        (0, vitest_1.expect)((await request('/classes', { method: 'POST', token: await login(canonical.email), body: classInput({ title: 'Canonical wins', startsAt: future(123) }) })).status).toBe(403);
    });
    (0, vitest_1.it)('enforces expiry states and processes an idempotent simulated renewal', async () => {
        const expired = await register(`${prefix}-expired@seniorlearn.test`, 'Expired Member'), expiredId = new mongoose_1.default.Types.ObjectId(expired.user.id);
        owned.users.push(expiredId);
        await index_js_1.Membership.findOneAndUpdate({ user: expiredId }, { status: 'ACTIVE', expiresAt: new Date('2020-01-01T00:00:00Z') });
        (0, vitest_1.expect)((await request('/classes', { token: expired.token })).status).toBe(403);
        (0, vitest_1.expect)((await request('/classes', { token: expired.token })).body.code).toBe('MEMBERSHIP_EXPIRED');
        (0, vitest_1.expect)((await request('/notifications', { token: expired.token })).status).toBe(200);
        (0, vitest_1.expect)((await request('/memberships/renewal-eligibility', { token: expired.token })).status).toBe(200);
        (0, vitest_1.expect)((await request('/memberships/renew', { method: 'POST', token: expired.token, body: {} })).status).toBe(402);
        (0, vitest_1.expect)((await index_js_1.Membership.findOne({ user: expiredId }).lean())?.status).toBe('ACTIVE');
        const renewed = await request('/memberships/renew', { method: 'POST', token: expired.token, body: { simulatePayment: true } });
        (0, vitest_1.expect)(renewed.status).toBe(200);
        const firstExpiry = renewed.body.membership.expiresAt;
        const duplicate = await request('/memberships/renew', { method: 'POST', token: expired.token, body: { simulatePayment: true } });
        (0, vitest_1.expect)(duplicate.status).toBe(200);
        (0, vitest_1.expect)(duplicate.body.duplicate).toBe(true);
        (0, vitest_1.expect)(duplicate.body.membership.expiresAt).toBe(firstExpiry);
        (0, vitest_1.expect)(await index_js_1.Payment.countDocuments({ user: expiredId, kind: 'RENEWAL' })).toBe(1);
        (0, vitest_1.expect)(await index_js_1.Notification.countDocuments({ user: expiredId, type: 'MEMBERSHIP_RENEWED' })).toBe(1);
        (0, vitest_1.expect)((await request('/classes', { token: expired.token })).status).toBe(200);
        const concurrent = await register(`${prefix}-concurrent@seniorlearn.test`, 'Concurrent Renewal'), concurrentId = new mongoose_1.default.Types.ObjectId(concurrent.user.id);
        owned.users.push(concurrentId);
        await index_js_1.Membership.findOneAndUpdate({ user: concurrentId }, { status: 'ACTIVE', expiresAt: new Date('2020-01-01') });
        const concurrentResults = await Promise.all([request('/memberships/renew', { method: 'POST', token: concurrent.token, body: { simulatePayment: true } }), request('/memberships/renew', { method: 'POST', token: concurrent.token, body: { simulatePayment: true } })]);
        (0, vitest_1.expect)(concurrentResults.every(result => result.status === 200)).toBe(true);
        (0, vitest_1.expect)(await index_js_1.Payment.countDocuments({ user: concurrentId, kind: 'RENEWAL' })).toBe(1);
        (0, vitest_1.expect)(await index_js_1.Notification.countDocuments({ user: concurrentId, type: 'MEMBERSHIP_RENEWED' })).toBe(1);
        const suspended = await register(`${prefix}-suspended@seniorlearn.test`, 'Suspended Member'), suspendedId = new mongoose_1.default.Types.ObjectId(suspended.user.id);
        owned.users.push(suspendedId);
        await index_js_1.Membership.findOneAndUpdate({ user: suspendedId }, { status: 'SUSPENDED' });
        (0, vitest_1.expect)((await request('/memberships/renew', { method: 'POST', token: suspended.token, body: { simulatePayment: true } })).body.code).toBe('MEMBERSHIP_SUSPENDED');
        (0, vitest_1.expect)((await request('/classes', { token: suspended.token })).status).toBe(403);
        const missing = await register(`${prefix}-missing@seniorlearn.test`, 'Missing Membership'), missingId = new mongoose_1.default.Types.ObjectId(missing.user.id);
        owned.users.push(missingId);
        await index_js_1.Membership.deleteOne({ user: missingId });
        (0, vitest_1.expect)((await request('/classes', { token: missing.token })).body.code).toBe('MEMBERSHIP_UNAVAILABLE');
        const honorary = await register(`${prefix}-honorary-lifetime@seniorlearn.test`, 'Honorary Member'), honoraryId = new mongoose_1.default.Types.ObjectId(honorary.user.id);
        owned.users.push(honoraryId);
        await index_js_1.User.findByIdAndUpdate(honoraryId, { roles: ['STANDARD', 'HONORARY'] });
        await index_js_1.Membership.findOneAndUpdate({ user: honoraryId }, { status: 'EXPIRED', expiresAt: new Date('2020-01-01') });
        const honoraryToken = honorary.token;
        (0, vitest_1.expect)((await request('/classes', { token: honoraryToken })).status).toBe(200);
        (0, vitest_1.expect)((await request('/memberships/renew', { method: 'POST', token: honoraryToken, body: {} })).body.lifetime).toBe(true);
        (0, vitest_1.expect)(await index_js_1.Payment.countDocuments({ user: honoraryId, kind: 'RENEWAL' })).toBe(0);
        await index_js_1.Membership.findOneAndUpdate({ user: (await index_js_1.User.findOne({ email: `${prefix}-admin@seniorlearn.test` }))._id }, { status: 'EXPIRED', expiresAt: new Date('2020-01-01') });
        (0, vitest_1.expect)((await request('/admin/overview', { token: adminToken })).status).toBe(200);
    });
    (0, vitest_1.it)('reads persisted records after the HTTP server is reinitialised', async () => {
        await new Promise(resolve => server.close(() => resolve()));
        server = node_http_1.default.createServer(app_js_1.default);
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        (0, vitest_1.expect)((await request('/me', { token: memberToken })).body.user.id).toBe(memberId);
        (0, vitest_1.expect)(await index_js_1.LearningClass.exists({ _id: classId })).toBeTruthy();
    });
});
