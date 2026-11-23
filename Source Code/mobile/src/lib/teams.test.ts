import { describe, expect, it } from "vitest";
import { isTeamsMeetingUrl } from "./teams";

describe("isTeamsMeetingUrl", () => {
  it("accepts HTTPS Teams meeting hosts and rejects unsafe links", () => {
    expect(isTeamsMeetingUrl("https://teams.microsoft.com/l/meetup-join/abc")).toBe(true);
    expect(isTeamsMeetingUrl("https://teams.live.com/meet/abc")).toBe(true);
    expect(isTeamsMeetingUrl("http://teams.microsoft.com/l/meetup-join/abc")).toBe(false);
    expect(isTeamsMeetingUrl("https://example.com/teams.microsoft.com")).toBe(false);
  });
});
