import { describe, expect, it } from "vitest";
import { recurrenceEndDate, recurringDates } from "./recurrence";

describe("recurrence scheduling", () => {
  it("creates exactly four weekly occurrences when count mode requests four", () => {
    const endDate = recurrenceEndDate("2026-11-27", 4, "WEEKLY");
    expect(endDate).toBe("2026-12-18");
    expect(recurringDates("2026-11-27", endDate, "WEEKLY")).toEqual(["2026-11-27", "2026-12-04", "2026-12-11", "2026-12-18"]);
  });

  it("uses the selected end-date inclusively without creating an occurrence beyond it", () => {
    expect(recurringDates("2026-11-27", "2026-12-14", "WEEKLY")).toEqual(["2026-11-27", "2026-12-04", "2026-12-11"]);
    expect(recurrenceEndDate("2026-11-27", 4, "BIWEEKLY")).toBe("2027-01-08");
  });
});
