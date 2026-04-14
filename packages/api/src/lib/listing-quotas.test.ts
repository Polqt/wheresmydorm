import { describe, expect, it, vi } from "vitest";

vi.mock("@wheresmydorm/db", () => ({
  db: {},
  listings: {},
  payments: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  sql: vi.fn(),
}));

import { toFinderQuotaStatus } from "./listing-quotas";

describe("toFinderQuotaStatus", () => {
  it("maps a paid quota row to unlimited finder status", () => {
    expect(
      toFinderQuotaStatus({
        allowed: true,
        daily_limit: 5,
        is_paid: true,
        remaining_finds: 999,
        used_today: 1,
      }),
    ).toEqual({
      advancedFiltersEnabled: true,
      canFind: true,
      dailyLimit: 5,
      hasUnlimitedFinds: true,
      isPaid: true,
      remainingFinds: 999,
      usedToday: 1,
    });
  });

  it("maps a free quota row to limited finder status", () => {
    expect(
      toFinderQuotaStatus({
        allowed: false,
        daily_limit: 5,
        is_paid: false,
        remaining_finds: 0,
        used_today: 5,
      }),
    ).toEqual({
      advancedFiltersEnabled: false,
      canFind: false,
      dailyLimit: 5,
      hasUnlimitedFinds: false,
      isPaid: false,
      remainingFinds: 0,
      usedToday: 5,
    });
  });
});
