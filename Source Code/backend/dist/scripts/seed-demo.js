"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
const index_js_1 = require("../models/index.js");
// This script never runs from application startup. Mutating mode requires both flags
// to exactly name the connected database, plus a local-only demo password.
const args = process.argv.slice(2), value = (n) => args[args.indexOf(n) + 1], apply = args.includes('--apply');
const DAY = 86400000, date = (days) => new Date(Date.now() + days * DAY), password = process.env.DEMO_SEED_PASSWORD;
const models = [index_js_1.ClassChange, index_js_1.BulletinRead, index_js_1.Favourite, index_js_1.Enrollment, index_js_1.Notification, index_js_1.Payment, index_js_1.RecurrenceRule, index_js_1.LearningClass, index_js_1.Course, index_js_1.Bulletin, index_js_1.Membership, index_js_1.Setting, index_js_1.User];
const raw = [
    ['m1', 'Margaret Wilson', 'margaret.wilson@example.com', 'STANDARD', 'ACTIVE', 180], ['m2', 'Peter Harris', 'peter.harris@example.com', 'STANDARD', 'ACTIVE', 145], ['m3', 'Helen Brooks', 'helen.brooks@example.com', 'STANDARD', 'ACTIVE', 99], ['m4', 'Robert Nguyen', 'robert.nguyen@example.com', 'STANDARD', 'ACTIVE', 72], ['m5', 'June Patel', 'june.patel@example.com', 'STANDARD', 'ACTIVE', 49], ['m6', 'Alan Cooper', 'alan.cooper@example.com', 'STANDARD', 'ACTIVE', 32], ['m7', 'Dorothy Evans', 'dorothy.evans@example.com', 'STANDARD', 'ACTIVE', 15], ['m8', 'Graham Lewis', 'graham.lewis@example.com', 'STANDARD', 'EXPIRED', -21], ['m9', 'Shirley Martin', 'shirley.martin@example.com', 'STANDARD', 'EXPIRED', -4], ['m10', 'Colin Wright', 'colin.wright@example.com', 'STANDARD', 'ACTIVE', 5], ['t1', 'Fiona McKenzie', 'fiona.mckenzie@example.com', 'PROFESSIONAL', 'ACTIVE', 90], ['t2', 'David O’Connor', 'david.oconnor@example.com', 'PROFESSIONAL', 'ACTIVE', 60], ['t3', 'Leanne Ford', 'leanne.ford@example.com', 'PROFESSIONAL', 'ACTIVE', 40], ['h1', 'Rosemary King', 'rosemary.king@example.com', 'HONORARY', 'ACTIVE', -365], ['a1', 'Alex Morgan', 'alex.morgan@example.com', 'ADMIN', 'ACTIVE', 365]
];
const accounts = raw.map(x => ({ key: x[0], name: x[1], email: x[2], role: x[3], status: x[4], expiry: x[5] }));
const plans = () => [...['Introduction to Smartphones', 'Safe Online Banking', 'Video Calling with Family', 'Email Basics', 'Recognising Online Scams', 'Digital Photography'].map((title, i) => ({ title, tutor: 't1', days: -25 - i * 22, status: 'COMPLETE' })), ...['Online Shopping Safety', 'Using Government Services Online', 'Introduction to Tablets', 'Cybersecurity for Seniors'].map((title, i) => ({ title, tutor: 't2', days: -18 - i * 27, status: 'COMPLETE' })), ...['Managing Photos on Your Tablet', 'Staying Connected Online'].map((title, i) => ({ title, tutor: 't3', days: -35 - i * 31, status: 'COMPLETE' })), { title: 'Getting Started with Email', tutor: 't3', days: -430, status: 'COMPLETE' }, ...['Smartphone Settings Made Simple', 'Safe Online Shopping', 'Video Calling Practice', 'Government Services Online', 'Digital Photography Walkthrough', 'Password Basics', 'Online Banking Questions', 'Tablet Skills Clinic'].map((title, i) => ({ title, tutor: ['t1', 't2', 't3'][i % 3], days: 7 + i * 5, status: 'SCHEDULED' })), ...['Introduction to Video Calling', 'Cyber Safety Questions', 'Email Attachments Workshop'].map((title, i) => ({ title, tutor: ['t1', 't2', 't3'][i], days: -12 - i * 17, status: 'CANCELLED' }))];
async function inventory() { const db = mongoose_1.default.connection.db, cs = await db.listCollections().toArray(); return Object.fromEntries(await Promise.all(cs.map(async (c) => [c.name, await db.collection(c.name).countDocuments()]))); }
async function validate(users) {
    const session = [...users.values()][0].$session();
    const [u, m, c, e, n, b, p] = await Promise.all([index_js_1.User.countDocuments().session(session), index_js_1.Membership.countDocuments().session(session), index_js_1.LearningClass.countDocuments().session(session), index_js_1.Enrollment.countDocuments().session(session), index_js_1.Notification.countDocuments().session(session), index_js_1.Bulletin.countDocuments().session(session), index_js_1.Payment.countDocuments().session(session)]);
    const counts = { users: u, memberships: m, classes: c, enrollments: e, notifications: n, bulletins: b, payments: p };
    if (u !== 15 || m !== 15 || c !== 24 || e < 25 || n !== 20 || b !== 7 || p !== 13)
        throw Error(`Post-seed count validation failed: ${JSON.stringify(counts)}`);
    for (const [key, want] of [['t1', 6], ['t2', 4], ['t3', 2]]) {
        const got = await index_js_1.LearningClass.countDocuments({ tutor: users.get(key)._id, status: 'COMPLETE', startsAt: { $gte: date(-365), $lte: new Date() } }).session(session);
        if (got !== want)
            throw Error(`Tutor ${key} qualification validation failed.`);
    }
    if (await index_js_1.Enrollment.exists({ user: { $nin: [...users.values()].map(u => u._id) } }).session(session))
        throw Error('Enrollment references are invalid.');
}
async function main() { if (!process.env.MONGODB_URI)
    throw Error('MONGODB_URI is required.'); await mongoose_1.default.connect(process.env.MONGODB_URI); const db = mongoose_1.default.connection.db; const database = db.databaseName; if (database === 'seniorlearn_test')
    throw Error('Refusing to operate on seniorlearn_test.'); const plan = { users: 15, memberships: 15, classes: { total: 24, scheduled: 8, complete: 13, cancelled: 3 }, enrollments: '30 active/history records', bulletins: 7, notifications: 20, payments: 13 }; const before = await inventory(); if (!apply) {
    console.log(JSON.stringify({ dryRun: true, database, before, affectedCollections: models.map(m => m.collection.name), plan, execute: `DEMO_SEED_PASSWORD=<demo-only-password> npm run seed:demo --workspace=backend -- --apply --database ${database} --confirm-database ${database}` }, null, 2));
    return;
} if (process.env.NODE_ENV === 'production')
    throw Error('Demo seeding is disabled when NODE_ENV=production.'); if (!password)
    throw Error('DEMO_SEED_PASSWORD is required.'); if (value('--database') !== database || value('--confirm-database') !== database)
    throw Error(`Both confirmation flags must exactly equal ${database}.`); const session = await mongoose_1.default.startSession(); try {
    await session.withTransaction(async () => { for (const m of models)
        await m.deleteMany({}, { session }); const hash = await bcrypt_1.default.hash(password, 12), users = new Map(); for (const a of accounts) {
        const roles = a.role === 'PROFESSIONAL' ? ['STANDARD', 'PROFESSIONAL'] : a.role === 'HONORARY' ? ['STANDARD', 'HONORARY'] : a.role === 'STANDARD' ? ['STANDARD'] : undefined;
        const [u] = await index_js_1.User.create([{ name: a.name, email: a.email, passwordHash: hash, phone: `0400000${String(accounts.indexOf(a)).padStart(3, '0')}`, dateOfBirth: new Date('1950-01-01'), role: a.role, roles, isAdmin: a.role === 'ADMIN' }], { session });
        users.set(a.key, u);
        await index_js_1.Membership.create([{ user: u._id, status: a.status, startsAt: date(-365), expiresAt: date(a.expiry), annualFeeCents: 5000 }], { session });
    } const classes = []; for (const x of plans()) {
        const [c] = await index_js_1.LearningClass.create([{ title: x.title, description: `A friendly SeniorLearn session: ${x.title}.`, tutor: users.get(x.tutor)._id, startsAt: date(x.days), durationMinutes: 60, capacity: 12, status: x.status, delivery: 'ONLINE', teamsLink: 'https://example.com/seniorlearn-demo-meeting' }], { session });
        classes.push(c);
    } const members = accounts.filter(a => a.role === 'STANDARD' || a.role === 'HONORARY'); let total = 0; for (let i = 0; i < members.length; i++)
        for (let j = 0; j < (i % 3) + 2; j++) {
            const c = classes[(i * 3 + j) % classes.length], cancelled = c.status === 'CANCELLED' || (i === 3 && j === 0);
            await index_js_1.Enrollment.create([{ user: users.get(members[i].key)._id, class: c._id, status: cancelled ? 'CANCELLED' : 'ACTIVE', ...(cancelled ? { cancelledAt: date(-10) } : {}) }], { session });
            total++;
        } const titles = ['Welcome to SeniorLearn', 'New Digital Skills Classes Available', 'Staying Safe from Online Scams', 'Community Learning Week', 'Holiday Class Schedule', 'Membership Renewal Reminder', 'Online Class Participation Guide'], bulletins = []; for (let i = 0; i < titles.length; i++) {
        const [b] = await index_js_1.Bulletin.create([{ author: users.get('a1')._id, title: titles[i], body: `SeniorLearn update: ${titles[i]}. Please visit the app for details.`, status: 'PUBLISHED', publishedAt: date(-180 + i * 25) }], { session });
        bulletins.push(b);
    } for (let i = 0; i < 6; i++)
        await index_js_1.BulletinRead.create([{ user: users.get(members[i].key)._id, bulletin: bulletins[i]._id, readAt: date(-20 + i) }], { session }); const targets = [...members, ...accounts.filter(a => a.role === 'PROFESSIONAL')], types = ['ENROLLMENT', 'CLASS_REMINDER', 'CLASS_CANCELLED', 'CLASS_UPDATED', 'MEMBERSHIP_RENEWAL_7_DAYS', 'MEMBERSHIP_RENEWAL_EXPIRED', 'MEMBERSHIP_RENEWED', 'BULLETIN', 'TUTOR_CLASS_SCHEDULED', 'TUTOR_CLASS_COMPLETED']; for (let i = 0; i < 20; i++) {
        const c = classes[i % classes.length];
        await index_js_1.Notification.create([{ user: users.get(targets[i % targets.length].key)._id, title: ['Class enrolment confirmed', 'Class reminder', 'Membership update', 'New bulletin available'][i % 4], body: `${c.title}: demonstration notification.`, type: types[i % types.length], ...(i % 3 ? { readAt: date(-i) } : {}), entity: { kind: i % 4 === 2 ? 'MEMBERSHIP' : 'CLASS', id: String(c._id), label: c.title } }], { session });
    } for (const a of accounts.filter(a => a.role !== 'ADMIN' && a.role !== 'HONORARY'))
        await index_js_1.Payment.create([{ user: users.get(a.key)._id, amountCents: 5000, kind: a.expiry < 0 ? 'RENEWAL' : 'REGISTRATION', status: 'SIMULATED_PAID', reference: `DEMO-${a.key.toUpperCase()}-2026` }], { session }); await validate(users); console.log(JSON.stringify({ seeded: true, database, plan: { ...plan, enrollments: total } }, null, 2)); });
}
finally {
    await session.endSession();
} }
main().catch(e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => mongoose_1.default.disconnect());
