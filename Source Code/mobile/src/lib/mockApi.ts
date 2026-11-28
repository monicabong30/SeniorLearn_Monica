import { Enrollment, LearningClass, User } from "./types";
import { canAdmin, hasRole } from "./permissions";
type Reply<T> = { data: T };
type Row = LearningClass & { tutor: any; occurrenceIndex: number };
const sleep = () => new Promise((r) => setTimeout(r, 120));
const fail = (status: number, message: string) =>
  Promise.reject({ response: { status, data: { error: message, message } } });
const id = () => `${Date.now()}${Math.random()}`;
const now = () => new Date().toISOString();
const users: Record<string, User> = {
  "member@seniorlearn.test": {
    id: "u1",
    name: "Pat Member",
    email: "member@seniorlearn.test",
    roles: ["STANDARD"],
    isAdmin: false,
  },
  "tutor@seniorlearn.test": {
    id: "u2",
    name: "Taylor Tutor",
    email: "tutor@seniorlearn.test",
    roles: ["STANDARD", "PROFESSIONAL"],
    isAdmin: false,
  },
  "admin@seniorlearn.test": {
    id: "u3",
    name: "Alex Admin",
    email: "admin@seniorlearn.test",
    roles: ["STANDARD"],
    isAdmin: true,
  },
};
const passwords: Record<string, string> = Object.fromEntries(
  Object.values(users).map((u) => [u.id, "SeniorLearn1!"]),
);
let current: User | null = null,
  classes: Row[] = [],
  enrollments: (Enrollment & { user?: User })[] = [],
  notices: any[] = [],
  bulletins: any[] = [],
  favourites: any[] = [],
  classChanges: any[] = [];
const memberships: Record<string, any> = {};
const auth = () => (current ? null : fail(401, "Authentication required"));
const permitted = (...roles: string[]) =>
  current &&
  (canAdmin(current) || roles.some((role) => hasRole(current, role as any)))
    ? null
    : fail(403, "Permission denied");
const mine = (item: Row) => canAdmin(current) || item.tutor.id === current?.id;
const active = (classId: string) =>
  enrollments.filter((x) => x.class._id === classId && x.status === "ACTIVE")
    .length;
const membership = (u: User) =>
  (memberships[u.id] ??= {
    status: "ACTIVE",
    startsAt: "2026-01-01",
    expiresAt: "2030-01-01",
    annualFeeCents: 5000,
  });
const notify = (user: string, title: string, body: string, type: string) =>
  notices.push({
    _id: id(),
    user,
    title,
    body,
    type,
    createdAt: now(),
    readAt: null,
  });
function seed() {
  if (classes.length) return;
  const tutor = users["tutor@seniorlearn.test"];
  classes = [0, 1, 2].map(
    (i) =>
      ({
        _id: `c${i}`,
        title: "Family History",
        description: "Research online archives and records.",
        startsAt: new Date(2027, 0, 4 + i * 7).toISOString(),
        durationMinutes: 60,
        capacity: 12,
        status: "SCHEDULED",
        delivery: "ONLINE",
        teamsLink: "https://teams.microsoft.com/example",
        tutor: { id: tutor.id, name: tutor.name, email: tutor.email },
        recurrenceSeriesId: "s1",
        occurrenceIndex: i,
        version: 1,
      }) as Row,
  );
  Object.values(users).forEach(membership);
  bulletins = [
    {
      _id: "b1",
      title: "Summer guide",
      body: "Learning opportunities for members.",
      status: "PUBLISHED",
      author: { name: "Alex Admin" },
      publishedAt: now(),
    },
  ];
}
const favouriteFor = (classId: string) =>
  favourites.find((x) => x.user === current?.id && x.classId === classId);
const recordChange = (c: any, before: any) => {
  const changes = [
    "title",
    "description",
    "startsAt",
    "durationMinutes",
    "address",
    "delivery",
    "status",
    "capacity",
  ]
    .filter(
      (field) => JSON.stringify(before[field]) !== JSON.stringify(c[field]),
    )
    .map((field) => ({ field, previous: before[field], current: c[field] }));
  if (!changes.length) return;
  const event = {
    _id: id(),
    classId: c._id,
    version: (c.version = (c.version || 1) + 1),
    changes,
    createdAt: now(),
  };
  classChanges.push(event);
  favourites
    .filter((f) => f.classId === c._id && f.seenVersion < event.version)
    .forEach((f) => {
      if (
        changes.some((x: any) =>
          ["startsAt", "status", "title", "description", "address"].includes(
            x.field,
          ),
        )
      )
        notify(
          f.user,
          "Favourite class updated",
          `${c.title} has changed.`,
          "FAVOURITE_CLASS_UPDATED",
        );
    });
};
const refresh = (c: Row) => {
  if (["SCHEDULED", "CLOSED"].includes(c.status))
    c.status = active(c._id) >= c.capacity ? "CLOSED" : "SCHEDULED";
};
const ownClass = (classId: string) => {
  const c = classes.find((x) => x._id === classId);
  return !c
    ? fail(404, "Class not found")
    : !mine(c)
      ? fail(403, "Not your class")
      : c;
};
const validateClass = (b: any, partial = false) => {
  if (!partial && (!b.title || !b.description || !b.startsAt || !b.capacity))
    return "Required class fields are missing";
  if (b.title !== undefined && b.title.length < 3)
    return "Class title must be at least 3 characters";
  if (b.description !== undefined && b.description.length < 10)
    return "Class description must be at least 10 characters";
  if (
    b.capacity !== undefined &&
    (!Number.isInteger(Number(b.capacity)) || Number(b.capacity) < 1)
  )
    return "Capacity must be at least 1";
  if (b.delivery === "ONLINE" && !b.teamsLink) return "Teams link required";
  if (b.delivery === "ON_PREMISES" && !b.address) return "Address required";
  return null;
};
const conflicts = (b: any, exclude?: string) =>
  classes.some(
    (c) =>
      c._id !== exclude &&
      c.tutor.id === current?.id &&
      ["DRAFT", "SCHEDULED", "CLOSED"].includes(c.status) &&
      new Date(b.startsAt) <
        new Date(new Date(c.startsAt).getTime() + c.durationMinutes * 60000) &&
      new Date(c.startsAt) <
        new Date(
          new Date(b.startsAt).getTime() + (b.durationMinutes || 60) * 60000,
        ),
  );
const occurrenceDates = (
  start: string,
  end: string,
  frequency: string,
  weekdays: number[],
) => {
  const out: Date[] = [],
    d = new Date(start),
    last = new Date(end);
  if (d > last) return out;
  for (let x = new Date(d); x <= last; x.setDate(x.getDate() + 1)) {
    const week = frequency === "BIWEEKLY" ? 14 : 7;
    if (frequency === "CUSTOM") {
      if (weekdays.includes(x.getDay())) out.push(new Date(x));
    } else if (Math.floor((x.getTime() - d.getTime()) / 86400000) % week === 0)
      out.push(new Date(x));
    if (out.length > 52) break;
  }
  return out;
};
export const mockApi = {
  async get(path: string, config?: any): Promise<Reply<any>> {
    await sleep();
    const no = auth();
    if (no) return no;
    seed();
    const params = config?.params || {};
    if (path === "/me")
      return { data: { user: current, membership: membership(current!) } };
    if (path === "/favourites")
      return {
        data: favourites
          .filter((f) => f.user === current!.id)
          .map((f) => {
            const item = classes.find((c) => c._id === f.classId);
            return item
              ? {
                  ...f,
                  class: item,
                  updates: classChanges.filter(
                    (change) =>
                      change.classId === f.classId &&
                      change.version > f.seenVersion,
                  ),
                }
              : null;
          })
          .filter(Boolean),
      };
    if (path.startsWith("/favourites/")) {
      const classId = path.split("/")[2],
        fav = favouriteFor(classId);
      return {
        data: {
          favourited: !!fav,
          favourite: fav,
          updates: fav
            ? classChanges.filter(
                (change) =>
                  change.classId === classId &&
                  change.version > fav.seenVersion,
              )
            : [],
        },
      };
    }
    if (path === "/classes") {
      let rows = classes.filter((c) =>
        params.mine === "true"
          ? canAdmin(current) || c.tutor.id === current!.id
          : ["SCHEDULED", "CLOSED"].includes(c.status),
      );
      if (params.search) {
        const q = String(params.search).toLowerCase();
        rows = rows.filter((c) =>
          `${c.title} ${c.description}`.toLowerCase().includes(q),
        );
      }
      return {
        data: rows.sort(
          (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
        ),
      };
    }
    if (path === "/enrollments")
      return { data: enrollments.filter((x) => x.user?.id === current!.id) };
    if (path === "/notifications")
      return {
        data: notices
          .filter((x) => x.user === current!.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      };
    if (path === "/bulletins")
      return {
        data:
          canAdmin(current)
            ? bulletins
            : bulletins.filter((x) => x.status === "PUBLISHED"),
      };
    if (path === "/admin/members") {
      const deny = permitted("ADMIN");
      if (deny) return deny;
      const q = String(params.search || "").toLowerCase();
      return {
        data: Object.values(users).filter((u) =>
          `${u.name} ${u.email}`.toLowerCase().includes(q),
        ),
      };
    }
    if (path.startsWith("/admin/members/")) {
      const deny = permitted("ADMIN");
      if (deny) return deny;
      const u = Object.values(users).find((x) => x.id === path.split("/")[3]);
      return u
        ? { data: { user: u, membership: membership(u) } }
        : fail(404, "Member not found");
    }
    if (path.endsWith("/roster")) {
      const c = classes.find((x) => x._id === path.split("/")[2]);
      if (!c) return fail(404, "Class not found");
      if (!mine(c))
        return fail(
          403,
          "Only the tutor or administrator may view this roster",
        );
      return {
        data: {
          capacity: c.capacity,
          count: active(c._id),
          enrollments: enrollments.filter((x) => x.class._id === c._id),
        },
      };
    }
    if (path.startsWith("/classes/")) {
      const c = classes.find((x) => x._id === path.split("/")[2]);
      return c
        ? { data: { class: c, enrollmentCount: active(c._id) } }
        : fail(404, "Class not found");
    }
    return fail(404, "Mock endpoint not found");
  },
  async post(path: string, body: any = {}): Promise<Reply<any>> {
    await sleep();
    seed();
    if (path === "/auth/login") {
      const u = users[body.email?.toLowerCase()];
      return u && body.password === "SeniorLearn1!"
        ? ((current = u), { data: { token: `mock-${u.id}`, user: u } })
        : fail(401, "Email or password is incorrect");
    }
    if (path === "/auth/register") {
      if (!body.name || !body.email || !body.password)
        return fail(400, "Required registration fields are missing");
      if (!/^\S+@\S+\.\S+$/.test(body.email))
        return fail(400, "Invalid email address");
      if (users[body.email]) return fail(409, "A record already exists");
      current = {
        id: id(),
        name: body.name,
        email: body.email,
        roles: ["STANDARD"],
        isAdmin: false,
      };
      users[current.email] = current;
      membership(current);
      notify(
        current.id,
        "Welcome to SeniorLearn",
        "Your standard membership registration is confirmed.",
        "MEMBERSHIP",
      );
      return { data: { token: `mock-${current.id}`, user: current } };
    }
    const no = auth();
    if (no) return no;
    if (path === "/memberships/renew") {
      if (body.simulatePayment !== true)
        return fail(402, "Payment confirmation required");
      const m = membership(current!);
      m.startsAt = now();
      m.expiresAt = new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      ).toISOString();
      m.status = "ACTIVE";
      notify(
        current!.id,
        "Membership renewed",
        "Your membership payment was successful.",
        "MEMBERSHIP",
      );
      return { data: { membership: m, free: hasRole(current, "HONORARY") } };
    }
    if (path === "/classes") {
      const deny = permitted("PROFESSIONAL", "ADMIN");
      if (deny) return deny;
      const issue = validateClass(body);
      if (issue) return fail(400, issue);
      if (conflicts(body))
        return fail(409, "This overlaps one of your scheduled classes");
      const c: any = {
        ...body,
        _id: id(),
        startsAt: new Date(body.startsAt).toISOString(),
        capacity: Number(body.capacity),
        durationMinutes: Number(body.durationMinutes || 60),
        status: body.status || "DRAFT",
        tutor: { id: current!.id, name: current!.name, email: current!.email },
      };
      classes.push(c);
      return { data: c };
    }
    if (path === "/classes/recurring") {
      const deny = permitted("PROFESSIONAL", "ADMIN");
      if (deny) return deny;
      const issue = validateClass(body);
      if (issue) return fail(400, issue);
      const dates = occurrenceDates(
        body.startsAt,
        body.endDate,
        body.frequency,
        body.weekdays || [],
      );
      if (!dates.length)
        return fail(400, "No valid occurrences were generated");
      if (dates.some((d) => conflicts({ ...body, startsAt: d.toISOString() })))
        return fail(409, "Scheduling conflict");
      const seriesId = id(),
        occurrences = dates.map((d, i) => {
          const c: any = {
            ...body,
            _id: id(),
            startsAt: d.toISOString(),
            capacity: Number(body.capacity),
            durationMinutes: Number(body.durationMinutes || 60),
            status: body.status || "DRAFT",
            recurrenceSeriesId: seriesId,
            occurrenceIndex: i,
            tutor: {
              id: current!.id,
              name: current!.name,
              email: current!.email,
            },
          };
          classes.push(c);
          return c;
        });
      return { data: { seriesId, occurrences } };
    }
    if (path === "/bulletins") {
      const deny = permitted("ADMIN");
      if (deny) return deny;
      if (!body.title || !body.body)
        return fail(400, "Title and body are required");
      const b = {
        _id: id(),
        title: body.title,
        body: body.body,
        status: "DRAFT",
        author: { name: current!.name },
      };
      bulletins.push(b);
      return { data: b };
    }
    if (path.includes("/publish")) {
      const classId = path.match(/^\/classes\/([^/]+)\/publish$/)?.[1];
      if (classId) {
        const deny = permitted("PROFESSIONAL", "ADMIN");
        if (deny) return deny;
        const c = ownClass(classId);
        if (!(c as any)._id) return c as any;
        if ((c as Row).status !== "DRAFT")
          return fail(409, "Only drafts can be published");
        (c as Row).status = "SCHEDULED";
        return { data: c };
      }
      const deny = permitted("ADMIN");
      if (deny) return deny;
      const b = bulletins.find((x) => x._id === path.split("/")[2]);
      if (!b) return fail(404, "Bulletin not found");
      b.status = "PUBLISHED";
      b.publishedAt = now();
      return { data: b };
    }
    const cancelId = path.match(/^\/classes\/([^/]+)\/cancel$/)?.[1];
    if (cancelId) {
      const deny = permitted("PROFESSIONAL", "ADMIN");
      if (deny) return deny;
      const c = ownClass(cancelId);
      if (!(c as any)._id) return c as any;
      (c as Row).status = "CANCELLED";
      enrollments
        .filter((e) => e.class._id === cancelId && e.status === "ACTIVE")
        .forEach((e) =>
          notify(
            e.user!.id,
            "Class cancelled",
            `${(c as Row).title} has been cancelled.`,
            "CLASS_CANCELLED",
          ),
        );
      return { data: c };
    }
    if (path.endsWith("/enrollments")) {
      const deny = permitted("STANDARD", "PROFESSIONAL", "HONORARY");
      if (deny) return deny;
      const c = classes.find((x) => x._id === path.split("/")[2]);
      if (!c) return fail(404, "Class not found");
      const currentMembership = membership(current!);
      const lifetime = canAdmin(current) || hasRole(current, "HONORARY" as any);
      const expiry = currentMembership.expiresAt ? new Date(currentMembership.expiresAt) : undefined;
      if (!lifetime && (!expiry || currentMembership.status !== "ACTIVE" || new Date(c.startsAt) > new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate(), 23, 59, 59, 999)))
        return fail(403, `Membership renewal required. Your membership expires on ${expiry ? expiry.toLocaleDateString("en-AU") : "the scheduled date"}. This class takes place after your membership expires.`);
      if (c.status === "CLOSED") return fail(409, "Class is full");
      if (c.status !== "SCHEDULED")
        return fail(409, "Class is not open for enrolment");
      if (new Date(c.startsAt) <= new Date())
        return fail(409, "Class has already started");
      if (
        enrollments.some(
          (e) =>
            e.class._id === c._id &&
            e.user?.id === current!.id &&
            e.status === "ACTIVE",
        )
      )
        return fail(409, "You are already enrolled in this class.");
      if (active(c._id) >= c.capacity) {
        refresh(c);
        return fail(409, "Class is full");
      }
      const row: any = { _id: id(), class: c, status: "ACTIVE", user: current };
      enrollments.push(row);
      refresh(c);
      notify(
        current!.id,
        "Enrolment confirmed",
        `You are enrolled in ${c.title}.`,
        "ENROLLMENT",
      );
      return { data: row };
    }
    const recurring = path.match(/^\/recurrences\/([^/]+)\/([^/]+)\/cancel$/);
    if (recurring) {
      const deny = permitted("PROFESSIONAL", "ADMIN");
      if (deny) return deny;
      const seed = classes.find(
        (c) => c._id === recurring[2] && c.recurrenceSeriesId === recurring[1],
      );
      if (!seed) return fail(404, "Occurrence not found");
      if (!mine(seed)) return fail(403, "Not your class");
      const target = classes.filter(
        (c) =>
          c.recurrenceSeriesId === seed.recurrenceSeriesId &&
          (body.scope === "ALL" ||
            (body.scope === "FUTURE" &&
              c.occurrenceIndex >= seed.occurrenceIndex) ||
            (body.scope === "SINGLE" && c._id === seed._id)),
      );
      target.forEach((c) => {
        c.status = "CANCELLED";
        enrollments
          .filter((e) => e.class._id === c._id && e.status === "ACTIVE")
          .forEach((e) =>
            notify(
              e.user!.id,
              "Class cancelled",
              `${c.title} has been cancelled.`,
              "CLASS_CANCELLED",
            ),
          );
      });
      return { data: { cancelled: target.map((c) => c._id) } };
    }
    return fail(404, "Mock endpoint not found");
  },
  async put(path: string, body: any = {}): Promise<Reply<any>> {
    await sleep();
    const no = auth();
    if (no) return no;
    seed();
    if (path === "/me") {
      if (body.name !== undefined) current!.name = body.name;
      if (body.phone !== undefined) (current as any).phone = body.phone;
      return { data: { user: current } };
    }
    if (path.startsWith("/notifications/")) {
      const n = notices.find(
        (x) => x._id === path.split("/")[2] && x.user === current!.id,
      );
      if (!n) return fail(404, "Notification not found");
      n.readAt = now();
      return { data: n };
    }
    if (path.startsWith("/admin/members/") && path.endsWith("/role")) {
      const deny = permitted("ADMIN");
      if (deny) return deny;
      const u = Object.values(users).find((x) => x.id === path.split("/")[3]);
      if (!u) return fail(404, "Member not found");
      if (canAdmin(u) || !Array.isArray(body.roles) || !body.roles.includes("STANDARD") || body.roles.some((role: string) => !["STANDARD", "PROFESSIONAL", "HONORARY"].includes(role))) return fail(400, "Invalid membership roles");
      u.roles = [...new Set(body.roles)] as User["roles"];
      return { data: { user: u } };
    }
    if (/^\/admin\/members\/[^/]+$/.test(path)) {
      const deny = permitted("ADMIN");
      if (deny) return deny;
      const u = Object.values(users).find((x) => x.id === path.split("/")[3]);
      if (!u) return fail(404, "Member not found");
      if (canAdmin(u) || !Array.isArray(body.roles) || !body.roles.includes("STANDARD") || body.roles.some((role: string) => !["STANDARD", "PROFESSIONAL", "HONORARY"].includes(role)) || new Set(body.roles).size !== body.roles.length) return fail(400, "Invalid membership roles");
      const m = membership(u);
      if (!m || !["ACTIVE", "PENDING", "EXPIRED"].includes(body.status) || Number.isNaN(new Date(body.expiresAt).getTime())) return fail(400, "Invalid membership details");
      u.roles = [...body.roles] as User["roles"];
      Object.assign(m, { status: body.status, expiresAt: new Date(body.expiresAt).toISOString() });
      return { data: { user: u, membership: m } };
    }
    if (path.startsWith("/bulletins/")) {
      const deny = permitted("ADMIN");
      if (deny) return deny;
      const b = bulletins.find((x) => x._id === path.split("/")[2]);
      if (!b) return fail(404, "Bulletin not found");
      Object.assign(b, body);
      return { data: b };
    }
    const classId = path.match(/^\/classes\/([^/]+)$/)?.[1];
    if (classId) {
      const deny = permitted("PROFESSIONAL", "ADMIN");
      if (deny) return deny;
      const c = ownClass(classId);
      if (!(c as any)._id) return c as any;
      if (new Date((c as Row).startsAt) <= new Date())
        return fail(409, "Started classes cannot be changed");
      const issue = validateClass(body, true);
      if (issue) return fail(400, issue);
      if (body.startsAt && conflicts({ ...c, ...body }, classId))
        return fail(409, "This overlaps one of your scheduled classes");
      Object.assign(c, body);
      enrollments
        .filter((e) => e.class._id === classId && e.status === "ACTIVE")
        .forEach((e) =>
          notify(
            e.user!.id,
            "Class updated",
            `${(c as Row).title} has been updated.`,
            "CLASS_UPDATED",
          ),
        );
      return { data: c };
    }
    const m = path.match(/^\/recurrences\/([^/]+)\/([^/]+)$/);
    if (m) {
      const deny = permitted("PROFESSIONAL", "ADMIN");
      if (deny) return deny;
      const seed = classes.find(
        (c) => c._id === m[2] && c.recurrenceSeriesId === m[1],
      );
      if (!seed) return fail(404, "Occurrence not found");
      if (!mine(seed)) return fail(403, "Not your class");
      if (!["SINGLE", "FUTURE", "ALL"].includes(body.scope))
        return fail(400, "Invalid scope");
      const target = classes.filter(
        (c) =>
          c.recurrenceSeriesId === seed.recurrenceSeriesId &&
          (body.scope === "ALL" ||
            (body.scope === "FUTURE" &&
              c.occurrenceIndex >= seed.occurrenceIndex) ||
            (body.scope === "SINGLE" && c._id === seed._id)),
      );
      target.forEach((c) => {
        Object.assign(c, body);
        enrollments
          .filter((e) => e.class._id === c._id && e.status === "ACTIVE")
          .forEach((e) =>
            notify(
              e.user!.id,
              "Class updated",
              `${c.title} has been updated.`,
              "CLASS_UPDATED",
            ),
          );
      });
      return { data: { updated: target.map((c) => c._id) } };
    }
    return fail(404, "Mock endpoint not found");
  },
  async delete(path: string): Promise<Reply<void>> {
    await sleep();
    const no = auth();
    if (no) return no;
    seed();
    if (path.startsWith("/bulletins/")) {
      const deny = permitted("ADMIN");
      if (deny) return deny;
      const i = bulletins.findIndex((x) => x._id === path.split("/")[2]);
      if (i < 0) return fail(404, "Bulletin not found");
      bulletins.splice(i, 1);
      return { data: undefined };
    }
    const classId = path.split("/")[2],
      c = classes.find((x) => x._id === classId),
      row = enrollments.find(
        (x) =>
          x.class._id === classId &&
          x.user?.id === current!.id &&
          x.status === "ACTIVE",
      );
    if (!row) return fail(404, "Active enrolment not found");
    row.status = "CANCELLED";
    if (c) refresh(c);
    return { data: undefined };
  },
};
const baseGet = mockApi.get.bind(mockApi),
  basePost = mockApi.post.bind(mockApi),
  basePut = mockApi.put.bind(mockApi),
  baseDelete = mockApi.delete.bind(mockApi);
mockApi.get = async (path: string, config?: any) => {
  if (path === "/favourites" || path.startsWith("/favourites/")) {
    await sleep();
    const no = auth();
    if (no) return no as any;
    seed();
    if (path === "/favourites")
      return {
        data: favourites
          .filter((f) => f.user === current!.id)
          .map((f) => {
            const item = classes.find((c) => c._id === f.classId);
            return item
              ? {
                  ...f,
                  class: item,
                  updates: classChanges.filter(
                    (change) =>
                      change.classId === f.classId &&
                      change.version > f.seenVersion,
                  ),
                }
              : null;
          })
          .filter(Boolean),
      };
    const classId = path.split("/")[2],
      fav = favouriteFor(classId);
    return {
      data: {
        favourited: !!fav,
        favourite: fav,
        updates: fav
          ? classChanges.filter(
              (change) =>
                change.classId === classId && change.version > fav.seenVersion,
            )
          : [],
      },
    };
  }
  return baseGet(path, config);
};
mockApi.post = async (path: string, body: any = {}) => {
  if (path === "/favourites") {
    await sleep();
    const no = auth();
    if (no) return no as any;
    seed();
    const c = classes.find((x) => x._id === body.classId);
    if (!c) return fail(404, "Class not found");
    if (favouriteFor(body.classId))
      return fail(409, "Class is already in Favourites");
    const favourite = {
      _id: id(),
      user: current!.id,
      classId: body.classId,
      seenVersion: (c as any).version || 1,
      createdAt: now(),
    };
    favourites.push(favourite);
    return { data: favourite };
  }
  return basePost(path, body);
};
mockApi.put = async (path: string, body: any = {}) => {
  if (path.startsWith("/favourites/") && path.endsWith("/seen")) {
    await sleep();
    const no = auth();
    if (no) return no as any;
    const fav = favouriteFor(path.split("/")[2]),
      c = classes.find((x) => x._id === path.split("/")[2]);
    if (!fav || !c) return fail(404, "Favourite not found");
    fav.seenVersion = (c as any).version || 1;
    return { data: fav };
  }
  const classId = path.match(/^\/classes\/([^/]+)$/)?.[1],
    before = classId
      ? { ...classes.find((c) => c._id === classId) }
      : undefined;
  const result = await basePut(path, body);
  if (classId && before) {
    const item = classes.find((c) => c._id === classId);
    if (item) recordChange(item, before);
  }
  return result;
};
mockApi.delete = async (path: string) => {
  if (path.startsWith("/favourites/")) {
    await sleep();
    const no = auth();
    if (no) return no as any;
    const index = favourites.findIndex(
      (f) => f.user === current!.id && f.classId === path.split("/")[2],
    );
    if (index < 0) return fail(404, "Favourite not found");
    favourites.splice(index, 1);
    return { data: undefined };
  }
  return baseDelete(path);
};
const standardPut = mockApi.put.bind(mockApi);
mockApi.put = async (path: string, body: any = {}) => {
  if (["/me/email", "/me/password"].includes(path)) {
    await sleep();
    const no = auth();
    if (no) return no as any;
    if (body.currentPassword !== passwords[current!.id])
      return fail(401, "Current password is incorrect");
    if (path === "/me/email") {
      const email = String(body.email || "").toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email))
        return fail(400, "Invalid email address");
      if (users[email] && users[email].id !== current!.id)
        return fail(409, "An account already uses this email address");
      delete users[current!.email];
      current!.email = email;
      users[email] = current!;
      return { data: { user: current } };
    }
    if (!String(body.newPassword || "").match(/^.{8,}$/))
      return fail(400, "New password must be at least 8 characters");
    passwords[current!.id] = body.newPassword;
    return { data: { message: "Password updated" } };
  }
  if (path === "/me" && body.dateOfBirth !== undefined)
    (current as any).dateOfBirth = body.dateOfBirth;
  return standardPut(path, body);
};
export const mockTestTools =
  process.env.NODE_ENV === "test"
    ? {
        reset: () => {
          current = null;
          classes = [];
          enrollments = [];
          notices = [];
          bulletins = [];
          favourites = [];
          classChanges = [];
          Object.values(users).forEach((u) => {
            u.roles =
              u.id === "u1"
                ? ["STANDARD"]
                : u.id === "u2"
                  ? ["STANDARD", "PROFESSIONAL"]
                  : ["STANDARD"];
            u.isAdmin = u.id === "u3";
            delete u.role;
            delete memberships[u.id];
          });
        },
        setClass: (classId: string, patch: Partial<LearningClass>) => {
          seed();
          const item = classes.find((x) => x._id === classId);
          if (!item) throw new Error("Class not found");
          const before = { ...item };
          Object.assign(item, patch);
          recordChange(item, before);
        },
      }
    : undefined;
