import http from 'node:http';
import { AddressInfo } from 'node:net';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app, { resetLoginRateLimitForTests } from '../app.js';
import { Bulletin, BulletinRead, ClassChange, Enrollment, Favourite, LearningClass, Membership, Notification, Payment, RecurrenceRule, User } from '../models/index.js';
import { integrationEnabled, testDatabaseUri } from './testDatabase.js';

const run = integrationEnabled ? describe : describe.skip;
const prefix = `integration-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const owned = { users: [] as mongoose.Types.ObjectId[], classes: [] as mongoose.Types.ObjectId[], bulletins: [] as mongoose.Types.ObjectId[] };
let server: http.Server;
let baseUrl = '';
let tutorToken = '', memberToken = '', secondMemberToken = '', adminToken = '';
let tutorId = '', memberId = '', secondMemberId = '';
let classId = '';

async function request(path: string, options: { method?: string; token?: string; body?: unknown } = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, { method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : undefined };
}
async function register(email: string, name: string) {
  const response = await request('/auth/register', { method: 'POST', body: { name, email, password: 'SeniorLearn1!', phone: '0412345678' } });
  expect(response.status).toBe(201); owned.users.push(new mongoose.Types.ObjectId(response.body.user.id)); return response.body;
}
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString();
const classInput = (overrides: Record<string, unknown> = {}) => ({ title: 'Digital photographs', description: 'Organise and safely share digital photographs.', startsAt: future(14), durationMinutes: 60, capacity: 2, delivery: 'ONLINE', teamsLink: 'https://teams.microsoft.com/example', ...overrides });

run('real MongoDB API integration', () => {
  beforeAll(async () => {
    const uri = testDatabaseUri();
    await mongoose.connect(uri);
    const db = mongoose.connection.db!;
    await db.collection('enrollments').dropIndex('user_1_class_1').catch(() => undefined);
    await Promise.all([User.syncIndexes(), Membership.syncIndexes(), LearningClass.syncIndexes(), Enrollment.syncIndexes(), Favourite.syncIndexes(), Notification.syncIndexes(), BulletinRead.syncIndexes(), ClassChange.syncIndexes(), RecurrenceRule.syncIndexes()]);
    expect((await db.collection('enrollments').indexes()).some(index => index.name === 'user_1_class_1')).toBe(false);
    server = http.createServer(app); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const tutor = await register(`${prefix}-tutor@seniorlearn.test`, 'Integration Tutor'); tutorId = tutor.user.id; await User.findByIdAndUpdate(tutorId, { roles: ['STANDARD','PROFESSIONAL'], isAdmin: false }); tutorToken = (await request('/auth/login', { method: 'POST', body: { email: tutor.user.email, password: 'SeniorLearn1!' } })).body.token;
    const member = await register(`${prefix}-member@seniorlearn.test`, 'Integration Member'); memberId = member.user.id; memberToken = member.token;
    const second = await register(`${prefix}-member2@seniorlearn.test`, 'Integration Member Two'); secondMemberId = second.user.id; secondMemberToken = second.token;
    const admin = await register(`${prefix}-admin@seniorlearn.test`, 'Integration Admin'); await User.findByIdAndUpdate(admin.user.id, { isAdmin: true }); adminToken = (await request('/auth/login', { method: 'POST', body: { email: admin.user.email, password: 'SeniorLearn1!' } })).body.token;
  }, 30000);

  afterAll(async () => {
    const classIds = owned.classes;
    await Promise.all([Notification.deleteMany({ user: { $in: owned.users } }), BulletinRead.deleteMany({ user: { $in: owned.users } }), Favourite.deleteMany({ user: { $in: owned.users } }), Enrollment.deleteMany({ $or: [{ user: { $in: owned.users } }, { class: { $in: classIds } }] }), ClassChange.deleteMany({ class: { $in: classIds } }), RecurrenceRule.deleteMany({ tutor: { $in: owned.users } }), LearningClass.deleteMany({ $or: [{ _id: { $in: classIds } }, { tutor: { $in: owned.users } }] }), Bulletin.deleteMany({ _id: { $in: owned.bulletins } }), Payment.deleteMany({ user: { $in: owned.users } }), Membership.deleteMany({ user: { $in: owned.users } }), User.deleteMany({ _id: { $in: owned.users } })]);
    await new Promise<void>(resolve => server?.close(() => resolve())); await mongoose.disconnect();
  });

  it('authenticates, persists profile changes, and never returns password hashes', async () => {
    expect((await request('/auth/login', { method: 'POST', body: { email: `${prefix}-member@seniorlearn.test`, password: 'wrong' } })).status).toBe(401);
    expect((await request('/me', { token: memberToken })).body.user.passwordHash).toBeUndefined();
    expect((await request('/me', { method: 'PUT', token: memberToken, body: { name: 'Persisted Member', phone: '0499999999' } })).status).toBe(200);
    expect((await User.findById(memberId).lean())?.name).toBe('Persisted Member');
    expect((await request('/me/password', { method: 'PUT', token: memberToken, body: { currentPassword: 'SeniorLearn1!', newPassword: 'Changed1!' } })).status).toBe(200);
    expect((await request('/auth/login', { method: 'POST', body: { email: `${prefix}-member@seniorlearn.test`, password: 'Changed1!' } })).status).toBe(200);
  });

  it('creates a complete standard registration without a date of birth', async () => {
    const email = `${prefix}-registration@seniorlearn.test`;
    const response = await request('/auth/register', { method: 'POST', body: { name: 'Registered Member', email, password: 'SeniorLearn1!', phone: '0412345678' } });
    expect(response.status).toBe(201);
    const user = await User.findById(response.body.user.id).select('+passwordHash').lean();
    owned.users.push(new mongoose.Types.ObjectId(response.body.user.id));
    expect(user?.roles).toEqual(['STANDARD']);
    expect(user?.dateOfBirth).toBeUndefined();
    expect(user?.createdAt).toBeInstanceOf(Date);
    expect(await bcrypt.compare('SeniorLearn1!', user!.passwordHash)).toBe(true);
    expect(await Membership.findOne({ user: user!._id, status: 'ACTIVE' })).toBeTruthy();
    expect(await Payment.findOne({ user: user!._id, kind: 'REGISTRATION', status: 'SIMULATED_PAID' })).toBeTruthy();
    expect((await request('/auth/register', { method: 'POST', body: { name: 'Registered Member', email, password: 'SeniorLearn1!', phone: '0412345678' } })).status).toBe(409);
    expect((await request('/auth/register', { method: 'POST', body: { name: 'x', email: 'invalid', password: 'short', phone: 'x' } })).status).toBe(400);
  });

  it('filters admin members and bulletins by persisted dates using inclusive end dates', async () => {
    await User.collection.updateOne({ _id: new mongoose.Types.ObjectId(memberId) }, { $set: { createdAt: new Date('2026-11-20T23:59:59.999Z') } });
    await Membership.findOneAndUpdate({ user: memberId }, { expiresAt: new Date('2026-12-15T12:00:00.000Z') });
    const registration = await request('/admin/members?dateType=Registration%20Date&startDate=2026-11-20&endDate=2026-11-20', { token: adminToken });
    expect(registration.status).toBe(200); expect(registration.body.some((item: any) => item.id === memberId)).toBe(true);
    const renewal = await request('/admin/members?dateType=Membership%20Renewal%20Date&startDate=2026-12-15&endDate=2026-12-15', { token: adminToken });
    expect(renewal.body.some((item: any) => item.id === memberId)).toBe(true);

    const created = await Bulletin.create({ title: 'Created date bulletin', body: 'This bulletin verifies date filtering behaviour.', status: 'DRAFT', author: adminToken ? (await User.findOne({ isAdmin: true }))!._id : undefined, createdAt: new Date('2026-11-10T10:00:00.000Z') });
    const published = await Bulletin.create({ title: 'Published date bulletin', body: 'This bulletin verifies publication date filtering.', status: 'PUBLISHED', author: (await User.findOne({ isAdmin: true }))!._id, createdAt: new Date('2026-11-01T10:00:00.000Z'), publishedAt: new Date('2026-11-20T23:59:59.999Z') });
    owned.bulletins.push(created._id, published._id);
    const createdResults = await request('/bulletins?dateType=Created%20Date&startDate=2026-11-10&endDate=2026-11-10', { token: adminToken });
    expect(createdResults.body.map((item: any) => item._id)).toContain(String(created._id));
    const publishedResults = await request('/bulletins?dateType=Published%20Date&startDate=2026-11-20&endDate=2026-11-20', { token: adminToken });
    expect(publishedResults.body.map((item: any) => item._id)).toContain(String(published._id));
    expect(publishedResults.body.map((item: any) => item._id)).not.toContain(String(created._id));
  });

  it('persists tutor lifecycle, enrolment, cancellation, re-enrolment and roster access', async () => {
    const created = await request('/classes', { method: 'POST', token: tutorToken, body: classInput() }); expect(created.status).toBe(201); classId = created.body._id; owned.classes.push(new mongoose.Types.ObjectId(classId));
    expect((await LearningClass.findById(classId).lean())?.status).toBe('DRAFT');
    expect((await request(`/classes/${classId}`, { method: 'PUT', token: tutorToken, body: { title: 'Updated digital photographs' } })).status).toBe(200);
    expect((await request(`/classes/${classId}/publish`, { method: 'POST', token: tutorToken })).status).toBe(200);
    expect((await request(`/classes/${classId}/enrollments`, { method: 'POST', token: memberToken })).status).toBe(201);
    expect((await request(`/classes/${classId}/enrollments`, { method: 'POST', token: memberToken })).status).toBe(409);
    expect((await request(`/classes/${classId}/roster`, { token: tutorToken })).body.count).toBe(1);
    expect((await request(`/classes/${classId}/roster`, { token: memberToken })).status).toBe(403);
    expect((await request(`/enrollments/${classId}`, { method: 'DELETE', token: memberToken })).status).toBe(204);
    expect((await request(`/classes/${classId}/enrollments`, { method: 'POST', token: memberToken })).status).toBe(201);
  });

  it('enforces final-seat capacity transactionally', async () => {
    const created = await request('/classes', { method: 'POST', token: tutorToken, body: classInput({ title: 'One place workshop', capacity: 1, startsAt: future(16) }) }); expect(created.status).toBe(201); const id = created.body._id; owned.classes.push(new mongoose.Types.ObjectId(id)); await request(`/classes/${id}/publish`, { method: 'POST', token: tutorToken });
    const results = await Promise.all([request(`/classes/${id}/enrollments`, { method: 'POST', token: memberToken }), request(`/classes/${id}/enrollments`, { method: 'POST', token: secondMemberToken })]);
    expect(results.map(result => result.status).sort()).toEqual([201, 409]); expect(await Enrollment.countDocuments({ class: id, status: 'ACTIVE' })).toBe(1);
  });

  it('lets only an administrator manage a class roster while preserving enrolment history', async () => {
    expect((await request(`/admin/classes/${classId}/enrollments`, { method: 'POST', token: memberToken, body: { userId: secondMemberId } })).status).toBe(403);
    expect((await request(`/admin/classes/${classId}/enrollments`, { method: 'POST', token: adminToken, body: { userId: secondMemberId } })).status).toBe(201);
    expect((await request(`/admin/classes/${classId}/enrollments`, { method: 'POST', token: adminToken, body: { userId: secondMemberId } })).status).toBe(409);
    expect((await request(`/classes/${classId}/roster`, { token: adminToken })).body.count).toBe(2);
    expect((await request(`/admin/classes/${classId}/enrollments/${secondMemberId}`, { method: 'DELETE', token: adminToken })).status).toBe(204);
    expect(await Enrollment.exists({ class: classId, user: secondMemberId, status: 'CANCELLED' })).toBeTruthy();
    expect((await request(`/classes/${classId}/roster`, { token: adminToken })).body.count).toBe(1);
  });

  it('persists weekly and biweekly recurrence scopes with their durations', async () => {
    for (const [frequency, start] of [['WEEKLY', future(30)], ['BIWEEKLY', future(60)]]) {
      const response = await request('/classes/recurring', { method: 'POST', token: tutorToken, body: { ...classInput({ title: `${frequency} integration series`, startsAt: start }), frequency, endDate: future(75), weekdays: [] } });
      expect(response.status).toBe(201); expect(response.body.occurrences.length).toBeGreaterThan(1); expect(response.body.occurrences.every((item: any) => item.durationMinutes === 60)).toBe(true); owned.classes.push(...response.body.occurrences.map((item: any) => new mongoose.Types.ObjectId(item._id)));
      const selected = response.body.occurrences[0]; expect((await request(`/recurrences/${response.body.seriesId}/${selected._id}`, { method: 'PUT', token: tutorToken, body: { scope: 'SINGLE', title: 'One changed occurrence' } })).status).toBe(200);
      expect((await request(`/recurrences/${response.body.seriesId}/${selected._id}/cancel`, { method: 'POST', token: tutorToken, body: { scope: 'FUTURE' } })).status).toBe(200);
    }
  });

  it('persists favourites, update notifications, notification read state, and admin bulletin lifecycle', async () => {
    expect((await request('/favourites', { method: 'POST', token: memberToken, body: { classId } })).status).toBe(201);
    expect((await request(`/classes/${classId}`, { method: 'PUT', token: tutorToken, body: { title: 'Changed again' } })).status).toBe(200);
    const notifications = await request('/notifications', { token: memberToken }); expect(notifications.body.some((item: any) => item.type === 'FAVOURITE_CLASS_UPDATED')).toBe(true);
    const notice = notifications.body[0]; expect((await request(`/notifications/${notice._id}/read`, { method: 'PUT', token: memberToken })).status).toBe(200);
    expect((await request(`/notifications/${notice._id}/read`, { method: 'PUT', token: secondMemberToken })).status).toBe(404);
    const bulletin = await request('/bulletins', { method: 'POST', token: adminToken, body: { title: 'Integration bulletin', body: 'Published through the real API.' } }); expect(bulletin.status).toBe(201); owned.bulletins.push(new mongoose.Types.ObjectId(bulletin.body._id)); expect((await request(`/bulletins/${bulletin.body._id}/publish`, { method: 'POST', token: adminToken })).status).toBe(200); expect((await request('/bulletins', { token: memberToken })).body.some((item: any) => item._id === bulletin.body._id)).toBe(true);
    expect((await request(`/admin/members/${secondMemberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD','HONORARY'] } })).status).toBe(200);
    expect((await request('/admin/overview', { token: adminToken })).status).toBe(200);
    const allClasses = await request('/admin/classes', { token: adminToken });
    expect(allClasses.status).toBe(200);
    const tutorOptions = await request('/admin/tutors', { token: adminToken });
    expect(tutorOptions.status).toBe(200);
    expect(tutorOptions.body).toContainEqual({ id: tutorId, name: 'Integration Tutor' });
    const tutorClasses = await request(`/admin/classes?tutorId=${tutorId}`, { token: adminToken });
    expect(tutorClasses.status).toBe(200);
    expect(tutorClasses.body.length).toBeGreaterThan(0);
    expect(tutorClasses.body.every((item: any) => String(item.tutor._id) === tutorId)).toBe(true);
    expect((await request('/admin/tutors', { token: memberToken })).status).toBe(403);
    expect((await request('/admin/members', { token: memberToken })).status).toBe(403);
    expect((await request(`/admin/members/${secondMemberId}/membership`, { method: 'PUT', token: adminToken, body: { status: 'PENDING' } })).status).toBe(200);
  });

  it('keeps bulletin read receipts private to each member', async () => {
    const bulletin = await request('/bulletins', { method: 'POST', token: adminToken, body: { title: 'Read receipt bulletin', body: 'Each member has their own persisted read state.' } });
    expect(bulletin.status).toBe(201); owned.bulletins.push(new mongoose.Types.ObjectId(bulletin.body._id));
    await request(`/bulletins/${bulletin.body._id}/publish`, { method: 'POST', token: adminToken });
    expect((await request('/bulletins', { token: memberToken })).body.find((item: any) => item._id === bulletin.body._id).readAt).toBeNull();
    expect((await request(`/bulletins/${bulletin.body._id}/read`, { method: 'PUT', token: memberToken })).status).toBe(200);
    expect((await request(`/bulletins/${bulletin.body._id}`, { token: memberToken })).body.readAt).toBeTruthy();
    expect((await request('/bulletins', { token: secondMemberToken })).body.find((item: any) => item._id === bulletin.body._id).readAt).toBeNull();
  });

  it('enforces canonical multi-role combinations and protects administrator authority', async () => {
    const cases = [
      { name: 'standard', roles: ['STANDARD'], tutorStatus: 403 },
      { name: 'professional', roles: ['STANDARD', 'PROFESSIONAL'], tutorStatus: 201 },
      { name: 'honorary', roles: ['STANDARD', 'HONORARY'], tutorStatus: 403 },
      { name: 'all-memberships', roles: ['STANDARD', 'PROFESSIONAL', 'HONORARY'], tutorStatus: 201 },
    ];
    for (const entry of cases) {
      const account = await register(`${prefix}-${entry.name}@seniorlearn.test`, `Role ${entry.name}`);
      const accountId = new mongoose.Types.ObjectId(account.user.id); owned.users.push(accountId);
      await User.findByIdAndUpdate(accountId, { roles: entry.roles, isAdmin: false });
      const token = (await request('/auth/login', { method: 'POST', body: { email: account.user.email, password: 'SeniorLearn1!' } })).body.token;
      const result = await request('/classes', { method: 'POST', token, body: classInput({ title: `Role ${entry.name} class`, startsAt: future(100 + cases.indexOf(entry)) }) });
      expect(result.status).toBe(entry.tutorStatus);
      if (result.status === 201) owned.classes.push(new mongoose.Types.ObjectId(result.body._id));
      expect((await request('/admin/overview', { token })).status).toBe(403);
    }
    expect((await request('/admin/overview', { token: adminToken })).status).toBe(200);
    expect((await request(`/admin/members/${memberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'ADMIN'] } })).status).toBe(400);
    expect((await request(`/admin/members/${memberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL'] } })).status).toBe(200);
    expect((await request(`/admin/members/${memberId}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD'] } })).status).toBe(200);
    const savedMember = await request(`/admin/members/${memberId}`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL', 'HONORARY'], status: 'PENDING', expiresAt: '2028-01-01' } });
    expect(savedMember.status).toBe(200);
    expect(savedMember.body.user.roles).toEqual(['STANDARD', 'PROFESSIONAL', 'HONORARY']);
    expect(savedMember.body.membership.status).toBe('PENDING');
    expect((await request(`/admin/members/${memberId}`, { method: 'GET', token: adminToken })).body.membership.expiresAt.slice(0,10)).toBe('2028-01-01');
    expect((await request(`/admin/members/${(await User.findOne({ isAdmin: true }).lean())!._id}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL'] } })).status).toBe(403);
    expect((await request(`/admin/members/${(await User.findOne({ isAdmin: true }).lean())!._id}`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD'], status: 'PENDING', expiresAt: '2028-01-01' } })).status).toBe(403);
  });

  it('applies role grants and revocations to already-issued identity-only JWTs', async () => {
    const professional = await register(`${prefix}-stale-professional@seniorlearn.test`, 'Stale Professional');
    const professionalId = new mongoose.Types.ObjectId(professional.user.id); owned.users.push(professionalId);
    await User.findByIdAndUpdate(professionalId, { roles: ['STANDARD', 'PROFESSIONAL'] });
    const professionalToken = (await request('/auth/login', { method: 'POST', body: { email: professional.user.email, password: 'SeniorLearn1!' } })).body.token;
    expect((await request('/classes', { method: 'POST', token: professionalToken, body: classInput({ title: 'Before revocation', startsAt: future(110) }) })).status).toBe(201);
    expect((await request(`/admin/members/${professional.user.id}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD'] } })).status).toBe(200);
    expect((await request('/classes', { method: 'POST', token: professionalToken, body: classInput({ title: 'After revocation', startsAt: future(111) }) })).status).toBe(403);

    const standard = await register(`${prefix}-stale-standard@seniorlearn.test`, 'Stale Standard');
    const standardId = new mongoose.Types.ObjectId(standard.user.id); owned.users.push(standardId);
    const standardToken = standard.token;
    expect((await request('/classes', { method: 'POST', token: standardToken, body: classInput({ title: 'Before grant', startsAt: future(112) }) })).status).toBe(403);
    expect((await request(`/admin/members/${standard.user.id}/role`, { method: 'PUT', token: adminToken, body: { roles: ['STANDARD', 'PROFESSIONAL'] } })).status).toBe(200);
    const granted = await request('/classes', { method: 'POST', token: standardToken, body: classInput({ title: 'After grant', startsAt: future(113) }) });
    expect(granted.status).toBe(201); owned.classes.push(new mongoose.Types.ObjectId(granted.body._id));
  });

  it('supports legacy singular role records without allowing them to override canonical roles', async () => {
    resetLoginRateLimitForTests();
    const passwordHash = await bcrypt.hash('SeniorLearn1!', 10);
    const legacy = async (suffix: string, role: string, roles?: string[]) => {
      const created=await User.create({name:`Legacy ${suffix}`,email:`${prefix}-legacy-${suffix}@seniorlearn.test`,passwordHash,role,...(roles?{roles}:{})}); owned.users.push(created._id);
      return { _id: created._id, email: `${prefix}-legacy-${suffix}@seniorlearn.test` };
    };
    const standard = await legacy('standard', 'STANDARD');
    const professional = await legacy('professional', 'PROFESSIONAL');
    const honorary = await legacy('honorary', 'HONORARY');
    const admin = await legacy('admin', 'ADMIN');
    const canonical = await legacy('canonical-wins', 'PROFESSIONAL', ['STANDARD']);
    const login = async (email: string) => (await request('/auth/login', { method: 'POST', body: { email, password: 'SeniorLearn1!' } })).body.token;
    expect((await request('/classes', { method: 'POST', token: await login(standard.email), body: classInput({ title: 'Legacy standard', startsAt: future(120) }) })).status).toBe(403);
    // Legacy records without a Membership record authenticate but cannot gain learning access.
    expect((await request('/classes', { method: 'POST', token: await login(professional.email), body: classInput({ title: 'Legacy professional', startsAt: future(121) }) })).status).toBe(403);
    expect((await request('/classes', { method: 'POST', token: await login(honorary.email), body: classInput({ title: 'Legacy honorary', startsAt: future(122) }) })).status).toBe(403);
    expect((await request('/admin/overview', { token: await login(admin.email) })).status).toBe(200);
    expect((await request('/classes', { method: 'POST', token: await login(canonical.email), body: classInput({ title: 'Canonical wins', startsAt: future(123) }) })).status).toBe(403);
  });

  it('enforces expiry states and processes an idempotent simulated renewal', async () => {
    const expired=await register(`${prefix}-expired@seniorlearn.test`,'Expired Member'), expiredId=new mongoose.Types.ObjectId(expired.user.id); owned.users.push(expiredId);
    await Membership.findOneAndUpdate({user:expiredId},{status:'ACTIVE',expiresAt:new Date('2020-01-01T00:00:00Z')});
    expect((await request('/classes',{token:expired.token})).status).toBe(403);
    expect((await request('/classes',{token:expired.token})).body.code).toBe('MEMBERSHIP_EXPIRED');
    expect((await request('/notifications',{token:expired.token})).status).toBe(200);
    expect((await request('/memberships/renewal-eligibility',{token:expired.token})).status).toBe(200);
    expect((await request('/memberships/renew',{method:'POST',token:expired.token,body:{}})).status).toBe(402);
    expect((await Membership.findOne({user:expiredId}).lean())?.status).toBe('ACTIVE');
    const renewed=await request('/memberships/renew',{method:'POST',token:expired.token,body:{simulatePayment:true}}); expect(renewed.status).toBe(200); const firstExpiry=renewed.body.membership.expiresAt;
    const duplicate=await request('/memberships/renew',{method:'POST',token:expired.token,body:{simulatePayment:true}}); expect(duplicate.status).toBe(200); expect(duplicate.body.duplicate).toBe(true); expect(duplicate.body.membership.expiresAt).toBe(firstExpiry);
    expect(await Payment.countDocuments({user:expiredId,kind:'RENEWAL'})).toBe(1); expect(await Notification.countDocuments({user:expiredId,type:'MEMBERSHIP_RENEWED'})).toBe(1); expect((await request('/classes',{token:expired.token})).status).toBe(200);
    const concurrent=await register(`${prefix}-concurrent@seniorlearn.test`,'Concurrent Renewal'), concurrentId=new mongoose.Types.ObjectId(concurrent.user.id); owned.users.push(concurrentId); await Membership.findOneAndUpdate({user:concurrentId},{status:'ACTIVE',expiresAt:new Date('2020-01-01')}); const concurrentResults=await Promise.all([request('/memberships/renew',{method:'POST',token:concurrent.token,body:{simulatePayment:true}}),request('/memberships/renew',{method:'POST',token:concurrent.token,body:{simulatePayment:true}})]); expect(concurrentResults.every(result=>result.status===200)).toBe(true); expect(await Payment.countDocuments({user:concurrentId,kind:'RENEWAL'})).toBe(1); expect(await Notification.countDocuments({user:concurrentId,type:'MEMBERSHIP_RENEWED'})).toBe(1);
    const suspended=await register(`${prefix}-suspended@seniorlearn.test`,'Suspended Member'), suspendedId=new mongoose.Types.ObjectId(suspended.user.id); owned.users.push(suspendedId); await Membership.findOneAndUpdate({user:suspendedId},{status:'SUSPENDED'});
    expect((await request('/memberships/renew',{method:'POST',token:suspended.token,body:{simulatePayment:true}})).body.code).toBe('MEMBERSHIP_SUSPENDED'); expect((await request('/classes',{token:suspended.token})).status).toBe(403);
    const missing=await register(`${prefix}-missing@seniorlearn.test`,'Missing Membership'), missingId=new mongoose.Types.ObjectId(missing.user.id); owned.users.push(missingId); await Membership.deleteOne({user:missingId}); expect((await request('/classes',{token:missing.token})).body.code).toBe('MEMBERSHIP_UNAVAILABLE');
    const honorary=await register(`${prefix}-honorary-lifetime@seniorlearn.test`,'Honorary Member'), honoraryId=new mongoose.Types.ObjectId(honorary.user.id); owned.users.push(honoraryId); await User.findByIdAndUpdate(honoraryId,{roles:['STANDARD','HONORARY']}); await Membership.findOneAndUpdate({user:honoraryId},{status:'EXPIRED',expiresAt:new Date('2020-01-01')}); const honoraryToken=honorary.token;
    expect((await request('/classes',{token:honoraryToken})).status).toBe(200); expect((await request('/memberships/renew',{method:'POST',token:honoraryToken,body:{}})).body.lifetime).toBe(true); expect(await Payment.countDocuments({user:honoraryId,kind:'RENEWAL'})).toBe(0);
    await Membership.findOneAndUpdate({user:(await User.findOne({email:`${prefix}-admin@seniorlearn.test`}))!._id},{status:'EXPIRED',expiresAt:new Date('2020-01-01')}); expect((await request('/admin/overview',{token:adminToken})).status).toBe(200);
  });

  it('reads persisted records after the HTTP server is reinitialised', async () => {
    await new Promise<void>(resolve => server.close(() => resolve())); server = http.createServer(app); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    expect((await request('/me', { token: memberToken })).body.user.id).toBe(memberId); expect(await LearningClass.exists({ _id: classId })).toBeTruthy();
  });
});
