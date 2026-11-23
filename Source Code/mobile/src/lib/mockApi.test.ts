import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, mockTestTools } from "./mockApi";
const login = (email: string) =>
  mockApi.post("/auth/login", { email, password: "SeniorLearn1!" });
describe("mock administrator workflows", () => {
  beforeEach(() => mockTestTools?.reset());
  it("lists, searches, reads and saves member role and membership changes together", async () => {
    await login("admin@seniorlearn.test");
    expect((await mockApi.get("/admin/members")).data).toHaveLength(3);
    expect(
      (await mockApi.get("/admin/members", { params: { search: "Pat" } }))
        .data[0].email,
    ).toBe("member@seniorlearn.test");
    const member = (
      await mockApi.get("/admin/members", { params: { search: "Pat" } })
    ).data[0];
    expect(
      (await mockApi.get(`/admin/members/${member.id}`)).data.user.name,
    ).toBe("Pat Member");
    await mockApi.put(`/admin/members/${member.id}`, {
      roles: ["STANDARD", "PROFESSIONAL"],
      status: "PENDING",
      expiresAt: "2028-01-01",
    });
    const after = (await mockApi.get(`/admin/members/${member.id}`)).data;
    expect(after.user.roles).toEqual(["STANDARD", "PROFESSIONAL"]);
    expect(after.membership.status).toBe("PENDING");
    expect(after.membership.expiresAt).toBe("2028-01-01T00:00:00.000Z");
  });
  it("rejects standard administrator access", async () => {
    await login("member@seniorlearn.test");
    await expect(mockApi.get("/admin/members")).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
  it("creates, edits, publishes and deletes a bulletin", async () => {
    await login("admin@seniorlearn.test");
    const draft = (
      await mockApi.post("/bulletins", { title: "Draft", body: "Initial body" })
    ).data;
    expect(
      (await mockApi.get("/bulletins")).data.some(
        (x: any) => x._id === draft._id,
      ),
    ).toBe(true);
    await mockApi.put(`/bulletins/${draft._id}`, {
      title: "Updated",
      body: "Updated body",
    });
    await mockApi.post(`/bulletins/${draft._id}/publish`);
    await login("member@seniorlearn.test");
    expect(
      (await mockApi.get("/bulletins")).data.some(
        (x: any) => x.title === "Updated",
      ),
    ).toBe(true);
    await login("admin@seniorlearn.test");
    await mockApi.delete(`/bulletins/${draft._id}`);
    expect(
      (await mockApi.get("/bulletins")).data.some(
        (x: any) => x._id === draft._id,
      ),
    ).toBe(false);
  });
  it("hides drafts and rejects member bulletin writes", async () => {
    await login("admin@seniorlearn.test");
    const draft = (
      await mockApi.post("/bulletins", { title: "Hidden", body: "Draft" })
    ).data;
    await login("member@seniorlearn.test");
    expect(
      (await mockApi.get("/bulletins")).data.some(
        (x: any) => x._id === draft._id,
      ),
    ).toBe(false);
    await expect(
      mockApi.post("/bulletins", { title: "No", body: "No" }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });
});
