import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, mockTestTools } from "./mockApi";
describe("mock account security", () => {
  beforeEach(() => mockTestTools?.reset());
  it("updates profile fields without allowing membership changes", async () => {
    await mockApi.post("/auth/login", {
      email: "member@seniorlearn.test",
      password: "SeniorLearn1!",
    });
    await mockApi.put("/me", {
      name: "Pat Updated",
      phone: "0412345678",
      dateOfBirth: "1950-01-01",
      roles: ["STANDARD", "PROFESSIONAL"],
      isAdmin: true,
    });
    const me = await mockApi.get("/me");
    expect(me.data.user.name).toBe("Pat Updated");
    expect(me.data.user.roles).toEqual(["STANDARD"]);
    expect(me.data.user.isAdmin).toBe(false);
  });
  it("rejects duplicate emails and incorrect current password", async () => {
    await mockApi.post("/auth/login", {
      email: "member@seniorlearn.test",
      password: "SeniorLearn1!",
    });
    await expect(
      mockApi.put("/me/email", {
        email: "admin@seniorlearn.test",
        currentPassword: "SeniorLearn1!",
      }),
    ).rejects.toMatchObject({ response: { status: 409 } });
    await expect(
      mockApi.put("/me/password", {
        currentPassword: "wrong",
        newPassword: "Changed1!",
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });
});
