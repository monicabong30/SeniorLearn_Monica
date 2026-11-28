import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import {
  Bulletin,
  BulletinRead,
  ClassChange,
  Course,
  Enrollment,
  Favourite,
  LearningClass,
  Membership,
  Notification,
  Payment,
  RecurrenceRule,
  Setting,
  User,
} from "../models/index.js";

// This script never runs from application startup. Mutating mode requires both flags
// to exactly name the connected database, plus a local-only demo password.
const args = process.argv.slice(2),
  value = (n: string) => args[args.indexOf(n) + 1],
  apply = args.includes("--apply");
const DAY = 86400000,
  date = (days: number) => new Date(Date.now() + days * DAY),
  password = process.env.DEMO_SEED_PASSWORD;
const models = [
  ClassChange,
  BulletinRead,
  Favourite,
  Enrollment,
  Notification,
  Payment,
  RecurrenceRule,
  LearningClass,
  Course,
  Bulletin,
  Membership,
  Setting,
  User,
] as const;
type Role = "STANDARD" | "PROFESSIONAL" | "HONORARY" | "ADMIN";
type A = {
  key: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED";
  expiry?: number;
};
const raw = [
  [
    "m1",
    "Margaret Wilson",
    "margaret.wilson@example.com",
    "STANDARD",
    "ACTIVE",
    180,
  ],
  ["m2", "Peter Harris", "peter.harris@example.com", "STANDARD", "ACTIVE", 145],
  ["m3", "Helen Brooks", "helen.brooks@example.com", "STANDARD", "ACTIVE", 99],
  [
    "m4",
    "Robert Nguyen",
    "robert.nguyen@example.com",
    "STANDARD",
    "ACTIVE",
    72,
  ],
  ["m5", "June Patel", "june.patel@example.com", "STANDARD", "ACTIVE", 49],
  ["m6", "Alan Cooper", "alan.cooper@example.com", "STANDARD", "ACTIVE", 32],
  ["m7", "Dorothy Evans", "dorothy.evans@example.com", "STANDARD", "PENDING"],
  [
    "m8",
    "Graham Lewis",
    "graham.lewis@example.com",
    "STANDARD",
    "EXPIRED",
    -21,
  ],
  [
    "m9",
    "Shirley Martin",
    "shirley.martin@example.com",
    "STANDARD",
    "EXPIRED",
    -4,
  ],
  ["m10", "Colin Wright", "colin.wright@example.com", "STANDARD", "ACTIVE", 5],
  [
    "t1",
    "Fiona McKenzie",
    "fiona.mckenzie@example.com",
    "PROFESSIONAL",
    "ACTIVE",
    90,
  ],
  [
    "t2",
    "David O’Connor",
    "david.oconnor@example.com",
    "PROFESSIONAL",
    "ACTIVE",
    60,
  ],
  [
    "t3",
    "Leanne Ford",
    "leanne.ford@example.com",
    "PROFESSIONAL",
    "ACTIVE",
    40,
  ],
  [
    "h1",
    "Rosemary King",
    "rosemary.king@example.com",
    "HONORARY",
    "ACTIVE",
    -365,
  ],
  ["a1", "Alex Morgan", "alex.morgan@example.com", "ADMIN", "ACTIVE", 365],
  ["a2", "Priya Shah", "priya.shah@example.com", "ADMIN", "ACTIVE", 365],
  ["t4", "Marcus Bell", "marcus.bell@example.com", "PROFESSIONAL", "ACTIVE", 28],
  ["t5", "Elaine Chen", "elaine.chen@example.com", "PROFESSIONAL", "ACTIVE", 7],
  ["m11", "Barbara Stone", "barbara.stone@example.com", "STANDARD", "ACTIVE", 14],
  ["m12", "Keith Turner", "keith.turner@example.com", "STANDARD", "ACTIVE", 210],
  ["m13", "Marian Doyle", "marian.doyle@example.com", "STANDARD", "SUSPENDED", 90],
  ["m14", "Noel Fraser", "noel.fraser@example.com", "STANDARD", "ACTIVE", 120],
  ["m15", "Lynette Green", "lynette.green@example.com", "STANDARD", "ACTIVE", 45],
  ["m16", "Harold James", "harold.james@example.com", "STANDARD", "ACTIVE", 180],
  ["m17", "Wendy Price", "wendy.price@example.com", "STANDARD", "ACTIVE", 60],
  ["m18", "Terence Hall", "terence.hall@example.com", "STANDARD", "ACTIVE", 8],
  ["m19", "Sandra Webb", "sandra.webb@example.com", "STANDARD", "ACTIVE", 300],
] as const;
const accounts = raw.map(
  (x) =>
    ({
      key: x[0],
      name: x[1],
      email: x[2],
      role: x[3],
      status: x[4],
      expiry: x[5],
    }) as A,
);
const plans = () => [
  ...[
    "Introduction to Smartphones",
    "Safe Online Banking",
    "Video Calling with Family",
    "Email Basics",
    "Recognising Online Scams",
    "Digital Photography",
  ].map((title, i) => ({
    title,
    tutor: "t1",
    days: -25 - i * 22,
    status: "COMPLETE",
  })),
  ...[
    "Online Shopping Safety",
    "Using Government Services Online",
    "Introduction to Tablets",
    "Cybersecurity for Seniors",
  ].map((title, i) => ({
    title,
    tutor: "t2",
    days: -18 - i * 27,
    status: "COMPLETE",
  })),
  ...["Managing Photos on Your Tablet", "Staying Connected Online"].map(
    (title, i) => ({
      title,
      tutor: "t3",
      days: -35 - i * 31,
      status: "COMPLETE",
    }),
  ),
  {
    title: "Getting Started with Email",
    tutor: "t3",
    days: -430,
    status: "COMPLETE",
  },
  ...[
    "Smartphone Settings Made Simple",
    "Safe Online Shopping",
    "Video Calling Practice",
    "Government Services Online",
    "Digital Photography Walkthrough",
    "Password Basics",
    "Online Banking Questions",
    "Tablet Skills Clinic",
  ].map((title, i) => ({
    title,
    tutor: ["t1", "t2", "t3"][i % 3],
    days: 7 + i * 5,
    status: "SCHEDULED",
  })),
  ...[
    "Introduction to Video Calling",
    "Cyber Safety Questions",
    "Email Attachments Workshop",
  ].map((title, i) => ({
    title,
    tutor: ["t1", "t2", "t3"][i],
    days: -12 - i * 17,
    status: "CANCELLED",
  })),
  ...["Digital Music Memories", "Online Library Skills", "Keeping Your Tablet Organised"].map((title, i) => ({ title, tutor: ["t1", "t2", "t3"][i], days: -60 - i * 12, status: "COMPLETE" })),
  { title: "Draft: Exploring Digital Maps", tutor: "t1", days: 30, status: "DRAFT" },
  { title: "Device Support Clinic", tutor: "t2", days: 14, status: "CLOSED" },
];
const recurringPlans = [
  ['digital-photography','Introduction to Digital Photography','t1','WEEKLY',6,'SCHEDULED',3], ['email-essentials','Email Essentials','t2','WEEKLY',4,'SCHEDULED',10],
  ['online-scams','Recognising Online Scams','t3','WEEKLY',8,'SCHEDULED',17], ['smartphone-clinic','Smartphone Basics','t4','WEEKLY',8,'SCHEDULED',24],
  ['video-family','Video Calling with Family','t5','BIWEEKLY',6,'SCHEDULED',31], ['digital-maps','Exploring Digital Maps','t1','WEEKLY',5,'DRAFT',38],
  ['banking-safety','Online Banking Safety','t2','WEEKLY',4,'DRAFT',45], ['word-basics','Introduction to Microsoft Word','t3','WEEKLY',6,'COMPLETE',-70],
  ['social-media','Social Media for Beginners','t4','WEEKLY',5,'COMPLETE',-60], ['tablet-start','Getting Started with Tablets','t5','WEEKLY',4,'CANCELLED',52],
  ['shopping-basics','Online Shopping Basics','t1','WEEKLY',4,'CLOSED',59], ['photo-management','Managing Digital Photos','t2','WEEKLY',8,'SCHEDULED',66],
] as const;
async function inventory() {
  const db = mongoose.connection.db!,
    cs = await db.listCollections().toArray();
  return Object.fromEntries(
    await Promise.all(
      cs.map(async (c) => [
        c.name,
        await db.collection(c.name).countDocuments(),
      ]),
    ),
  );
}
async function validate(users: Map<string, any>) {
  const session = [...users.values()][0].$session();
  const [u, m, c, e, n, b, p] = await Promise.all([
    User.countDocuments().session(session),
    Membership.countDocuments().session(session),
    LearningClass.countDocuments().session(session),
    Enrollment.countDocuments().session(session),
    Notification.countDocuments().session(session),
    Bulletin.countDocuments().session(session),
    Payment.countDocuments().session(session),
  ]);
  const counts = {
    users: u,
    memberships: m,
    classes: c,
    enrollments: e,
    notifications: n,
    bulletins: b,
    payments: p,
  };
  if (
    u !== 27 || m !== 27 || c < 90 || e < 120 || e > 180 || n < 50 || b < 12 || p < 20
  )
    throw Error(`Post-seed count validation failed: ${JSON.stringify(counts)}`);
  for (const [key, want] of [
    ["t1", 7],
    ["t2", 5],
    ["t3", 3],
  ] as const) {
    const got = await LearningClass.countDocuments({
      tutor: users.get(key)._id,
      status: "COMPLETE",
      startsAt: { $gte: date(-365), $lte: new Date() },
    }).session(session);
    if (got < want)
      throw Error(`Tutor ${key} qualification validation failed.`);
  }
  if (
    await Enrollment.exists({
      user: { $nin: [...users.values()].map((u) => u._id) },
    }).session(session)
  )
    throw Error("Enrollment references are invalid.");
  if (await Enrollment.exists({ user: { $in: [users.get("m7")._id, users.get("m8")._id, users.get("m9")._id] } }).session(session))
    throw Error("Pending or expired members must not be enrolled.");
  const statuses = (await LearningClass.distinct("status", {}, { session })) as string[];
  if (!["DRAFT", "SCHEDULED", "CLOSED", "COMPLETE", "CANCELLED"].every((status) => statuses.includes(status)))
    throw Error("Not all required class statuses were seeded.");
  if (await RecurrenceRule.countDocuments().session(session) !== 12) throw Error("Recurring series validation failed.");
  const closed = await LearningClass.findOne({ status: "CLOSED" }).session(session);
  if (!closed || await Enrollment.countDocuments({ class: closed._id, status: "ACTIVE" }).session(session) !== closed.capacity)
    throw Error("Closed classes must be at capacity.");
  if (await Favourite.countDocuments().session(session) < 3) throw Error("Favourite validation failed.");
  if (await Payment.countDocuments({ status: { $ne: "PAID" } }).session(session) !== 1)
    throw Error("Payment activation validation failed.");
}
async function main() {
  if (!process.env.MONGODB_URI) throw Error("MONGODB_URI is required.");
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db!;
  const database = db.databaseName;
  if (database === "seniorlearn_test")
    throw Error("Refusing to operate on seniorlearn_test.");
  const plan = { users: { admins: 2, tutors: 5, members: 20 }, memberships: { total: 27, pending: 1, expired: 2, suspended: 1 }, classes: { single: 29, recurringSeries: 12, recurringOccurrences: 68 }, enrollments: "120–180 active/history records; no inactive member enrolments", recurringSeries: 12, favourites: 3, bulletins: 12, notifications: 55, payments: { total: 20, seededOnly: true } };
  const before = await inventory();
  if (!apply) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          database,
          before,
          affectedCollections: models.map((m) => m.collection.name),
          plan,
          execute: `DEMO_SEED_PASSWORD=<demo-only-password> DEMO_SEED_TARGET=${database} npm run seed:demo --workspace=backend -- --apply --database ${database} --confirm-database ${database}`,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (process.env.NODE_ENV === "production")
    throw Error("Demo seeding is disabled when NODE_ENV=production.");
  if (process.env.DEMO_SEED_TARGET !== database)
    throw Error("Set DEMO_SEED_TARGET to the exact confirmed development/demo database name.");
  if (!password) throw Error("DEMO_SEED_PASSWORD is required.");
  if (
    value("--database") !== database ||
    value("--confirm-database") !== database
  )
    throw Error(`Both confirmation flags must exactly equal ${database}.`);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const m of models) await (m as any).deleteMany({}, { session });
      const hash = await bcrypt.hash(password, 12),
        users = new Map<string, any>();
      for (const a of accounts) {
        const roles =
          a.role === "PROFESSIONAL"
            ? ["STANDARD", "PROFESSIONAL"]
            : a.role === "HONORARY"
              ? ["STANDARD", "HONORARY"]
              : a.role === "STANDARD"
                ? ["STANDARD"]
                : undefined;
        const [u] = await User.create(
          [
            {
              name: a.name,
              email: a.email,
              passwordHash: hash,
              phone: `0400000${String(accounts.indexOf(a)).padStart(3, "0")}`,
              dateOfBirth: new Date("1950-01-01"),
              role: a.role,
              roles,
              isAdmin: a.role === "ADMIN",
            },
          ],
          { session },
        );
        users.set(a.key, u);
        await Membership.create(
          [
            {
              user: u._id,
              status: a.status,
              startsAt: date(-365),
              ...(a.status === "PENDING" ? {} : { expiresAt: date(a.expiry!) }),
              annualFeeCents: 5000,
            },
          ],
          { session },
        );
      }
      const classes: any[] = [];
      for (const x of plans()) {
        const [c] = await LearningClass.create(
          [
            {
              title: x.title,
              description: `A friendly SeniorLearn session: ${x.title}.`,
              tutor: users.get(x.tutor)!._id,
              startsAt: date(x.days),
              durationMinutes: 60,
              // CLOSED is reserved for a capacity closure, so the seeded
              // closed class must be genuinely full.
              capacity: x.status === "CLOSED" ? 8 : 12,
              status: x.status,
              delivery: "ONLINE",
              // Demo-only URL: shaped like a Teams meeting URL so the mobile
              // app can hand it to Microsoft Teams (or the browser).
              teamsLink: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_SeniorLearnDemo%40thread.v2/0?context=%7B%22Tid%22%3A%22seniorlearn-demo%22%2C%22Oid%22%3A%22demo-host%22%7D",
            },
          ],
          { session },
        );
        classes.push(c);
      }
      // Real series are seeded as independent occurrences, not title-based groups.
      // Their states deliberately cover the dashboard and calendar demonstrations.
      for (const [key,title,tutor,frequency,count,seriesStatus,startDays] of recurringPlans) {
        const interval=frequency==='BIWEEKLY'?14:7, occurrences:any[]=[];
        for(let index=0;index<count;index++){
          const status=key==='digital-photography'&&index===0?'COMPLETE':key==='digital-photography'&&index===3?'CANCELLED':seriesStatus==='DRAFT'?'DRAFT':seriesStatus==='CANCELLED'?'CANCELLED':seriesStatus==='COMPLETE'?'COMPLETE':seriesStatus==='CLOSED'?'CLOSED':'SCHEDULED';
          const startsAt=key==='digital-photography'&&index===0?date(-4):date(startDays+index*interval);
          const [occurrence]=await LearningClass.create([{title,description:`A practical SeniorLearn series on ${title.toLowerCase()}, with individual dates available to enrol in.`,tutor:users.get(tutor)!._id,startsAt,durationMinutes:60,capacity:index===2&&key==='digital-photography'?5:12,status,delivery:'ONLINE',teamsLink:'https://teams.microsoft.com/l/meetup-join/19%3ameeting_SeniorLearnDemo%40thread.v2/0?context=%7B%22Tid%22%3A%22seniorlearn-demo%22%7D',recurrenceSeriesId:`demo-series-${key}`,occurrenceIndex:index}],{session});
          occurrences.push(occurrence); classes.push(occurrence);
        }
        await RecurrenceRule.create([{seriesId:`demo-series-${key}`,tutor:users.get(tutor)!._id,frequency,weekdays:[],endDate:occurrences[occurrences.length-1].startsAt,classIds:occurrences.map(item=>item._id),status:seriesStatus}],{session});
      }
      const members = accounts.filter(
        (a) => (a.role === "STANDARD" && a.status === "ACTIVE") || a.role === "HONORARY",
      );
      let total = 0;
      // Deliberately varied, deterministic occupancy makes the demo feel like
      // a real class catalogue while keeping every result reproducible.
      const occupancy = [3, 6, 1, 5, 2, 7, 4, 3, 6, 2, 5, 1, 4, 7, 2, 6, 3, 5, 1, 4, 2];
      const enrolable = classes.filter((item) => ["SCHEDULED", "COMPLETE"].includes(item.status)).slice(0, 35);
      for (let i = 0; i < enrolable.length; i++)
        for (let j = 0; j < occupancy[i % occupancy.length]; j++) {
          const c = enrolable[i];
          await Enrollment.create(
            [
              {
                user: users.get(members[(i + j) % members.length].key)._id,
                class: c._id,
                status: "ACTIVE",
              },
            ],
            { session },
          );
          total++;
        }
      const calendarEnrolled = classes.find(item => item.recurrenceSeriesId === "demo-series-digital-photography" && item.occurrenceIndex === 1);
      if (calendarEnrolled) {
        await Enrollment.create([{ user: users.get("m1")._id, class: calendarEnrolled._id, status: "ACTIVE" }], { session });
        total++;
      }
      for (const [i, c] of classes.filter((item) => item.status === "CANCELLED").entries()) {
        await Enrollment.create([{ user: users.get(members[i % members.length].key)._id, class: c._id, status: "CANCELLED", cancelledAt: date(-10 - i) }], { session });
        total++;
      }
      const closedClass = classes.find((item) => item.status === "CLOSED");
      if (!closedClass) throw Error("Closed demo class is missing.");
      for (const member of members.slice(0, closedClass.capacity)) {
        await Enrollment.create([{ user: users.get(member.key)._id, class: closedClass._id, status: "ACTIVE" }], { session });
        total++;
      }
      for (let i = 0; i < 3; i++)
        await Favourite.create([{ user: users.get(members[i].key)._id, class: classes[i]._id, seenVersion: 1 }], { session });
      const titles = [
          "Welcome to SeniorLearn",
          "New Digital Skills Classes Available",
          "Staying Safe from Online Scams",
          "Community Learning Week",
          "Holiday Class Schedule",
          "Membership Renewal Reminder",
          "Online Class Participation Guide",
          "Meet Your SeniorLearn Tutors",
          "Platform Maintenance Notice",
          "Community Learning Event",
          "Microsoft Teams Joining Guide",
          "Holiday Opening Hours",
        ],
        bulletins: any[] = [];
      for (let i = 0; i < titles.length; i++) {
        const [b] = await Bulletin.create(
          [
            {
              author: users.get("a1")._id,
              title: titles[i],
              body: `SeniorLearn update: ${titles[i]}. Please visit the app for details.`,
              status: "PUBLISHED",
              publishedAt: date(-180 + i * 25),
            },
          ],
          { session },
        );
        bulletins.push(b);
      }
      for (let i = 0; i < 6; i++)
        await BulletinRead.create(
          [
            {
              user: users.get(members[i].key)._id,
              bulletin: bulletins[i]._id,
              readAt: date(-20 + i),
            },
          ],
          { session },
        );
      const classById = new Map(classes.map(item => [String(item._id), item]));
      const activeEnrolments = await Enrollment.find({ status: "ACTIVE" }).session(session);
      const upcoming = classes.filter(item => item.status === "SCHEDULED" && item.startsAt > new Date());
      const cancelled = classes.filter(item => item.status === "CANCELLED");
      const completed = classes.filter(item => item.status === "COMPLETE");
      const formatDateTime = (item: any) => item.startsAt.toLocaleString("en-AU", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
      const notificationFor = (index: number) => {
        const enrolment = activeEnrolments[index % activeEnrolments.length], enrolledClass = classById.get(String(enrolment.class))!, course = upcoming[index % upcoming.length], cancelledClass = cancelled[index % cancelled.length], completedClass = completed[index % completed.length], bulletin = bulletins[index % bulletins.length], member = members[index % members.length], account = accounts.find(item => item.key === member.key)!;
        const membershipLabel = "Membership";
        const cases: any[] = [
          { user: enrolment.user, title: "Enrolment confirmed", body: `You are enrolled in ${enrolledClass.title} on ${formatDateTime(enrolledClass)}.`, type: "ENROLLMENT", entity: { kind: "CLASS", id: String(enrolledClass._id), label: enrolledClass.title } },
          { user: enrolment.user, title: "Class reminder", body: `Your ${course.title} class starts on ${formatDateTime(course)}.`, type: "CLASS_REMINDER", entity: { kind: "CLASS", id: String(course._id), label: course.title } },
          { user: enrolment.user, title: "Class schedule updated", body: `${course.title} has been rescheduled to ${formatDateTime(course)}.`, type: "CLASS_UPDATED", entity: { kind: "CLASS", id: String(course._id), label: course.title } },
          { user: enrolment.user, title: "Class cancelled", body: `Your ${cancelledClass.title} class scheduled for ${formatDateTime(cancelledClass)} has been cancelled.`, type: "CLASS_CANCELLED", entity: { kind: "CLASS", id: String(cancelledClass._id), label: cancelledClass.title } },
          { user: users.get("m18")._id, title: "Membership renewal reminder", body: "Your membership expires in 7 days. Renew your membership to continue learning.", type: "MEMBERSHIP_RENEWAL_7_DAYS", entity: { kind: "MEMBERSHIP", label: membershipLabel } },
          { user: users.get("m8")._id, title: "Membership expired", body: "Your membership has expired. Renew your membership to restore access.", type: "MEMBERSHIP_RENEWAL_EXPIRED", entity: { kind: "MEMBERSHIP", label: membershipLabel } },
          { user: users.get("t1")._id, title: "Professional Membership renewal", body: "You have completed the required teaching activity and are eligible for complimentary Professional Membership renewal.", type: "MEMBERSHIP_RENEWED", entity: { kind: "MEMBERSHIP", label: membershipLabel } },
          { user: users.get(member.key)._id, title: "New bulletin available", body: `A new bulletin, ${bulletin.title}, is now available.`, type: "BULLETIN", entity: { kind: "BULLETIN", id: String(bulletin._id), label: bulletin.title } },
          { user: users.get("t2")._id, title: "Class completed", body: `${completedClass.title} has been marked complete.`, type: "TUTOR_CLASS_COMPLETED", entity: { kind: "CLASS", id: String(completedClass._id), label: completedClass.title } },
          { user: users.get(account.key)._id, title: "Membership activated", body: "Your membership is active and you can now enrol in classes.", type: "PAYMENT_CONFIRMED", entity: { kind: "MEMBERSHIP", label: membershipLabel } },
          { user: users.get("m2")._id, title: "Payment received", body: "Your annual membership payment has been received and your membership remains active.", type: "PAYMENT_CONFIRMED", entity: { kind: "MEMBERSHIP", label: membershipLabel } },
        ];
        return cases[index % cases.length];
      };
      for (let i = 0; i < 55; i++) {
        const item = notificationFor(i);
        await Notification.create([{ ...item, ...(i % 3 ? { readAt: date(-i - 1) } : {}), createdAt: date(-55 + i), updatedAt: date(-55 + i) }], { session });
      }
      for (const a of accounts.filter(
        (a) => a.role !== "ADMIN" && a.role !== "HONORARY",
      ))
        await Payment.create(
          [
            {
              user: users.get(a.key)._id,
              amountCents: 5000,
              kind: (a.expiry ?? 1) < 0 ? "RENEWAL" : "REGISTRATION",
              status: a.status === "PENDING" ? "PENDING" : "PAID",
              reference: `DEMO-${a.key.toUpperCase()}-2026`,
            },
          ],
          { session },
        );
      await validate(users);
      const [classStatus, membershipStatus] = await Promise.all([
        LearningClass.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).session(session),
        Membership.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).session(session),
      ]);
      console.log(
        JSON.stringify(
          { seeded: true, database, counts: { admins: 2, tutors: 5, members: 20, singleClasses: 29, recurringSeries: 12, recurringClasses: 68, enrollments: total, bulletins: 12, notifications: 55, payments: await Payment.countDocuments().session(session) }, classStatus, membershipStatus, demoAccounts: ["alex.morgan@example.com (admin)", "fiona.mckenzie@example.com (tutor)", "margaret.wilson@example.com (calendar enrolment member)"] },
          null,
          2,
        ),
      );
    });
  } finally {
    await session.endSession();
  }
}
main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
