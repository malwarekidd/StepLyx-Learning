import { describe, expect, it } from "vitest";

import {
  canOpenLesson,
  comboBonus,
  getNodeStatuses,
  isPlausibleLocalDate,
  lessonXp,
  nextStreak,
  starsFor,
  visibleStreak,
} from "@/lib/game-logic";

const ids = ["a", "b", "c"];

describe("path node status", () => {
  it("makes only the first lesson active on a fresh path", () => {
    expect(getNodeStatuses(ids, {})).toEqual({ a: "active", b: "locked", c: "locked" });
  });
  it("unlocks the next lesson after the previous one is finished", () => {
    expect(getNodeStatuses(ids, { a: { score: 1, total: 4 } })).toEqual({
      a: "completed",
      b: "active",
      c: "locked",
    });
  });
  it("never opens a locked lesson", () => {
    expect(canOpenLesson("locked")).toBe(false);
  });
});

describe("XP", () => {
  it("gives 10 per correct answer plus 20 for a first completion", () => {
    expect(lessonXp([true, false, true, false], null)).toBe(40);
  });
  it("adds 5 combo XP from the third correct answer in a row", () => {
    expect(comboBonus([true, true, true, true])).toBe(10);
    expect(lessonXp([true, true, true, true], null)).toBe(40 + 20 + 10);
  });
  it("only rewards improvement on replays", () => {
    expect(lessonXp([true, true, true, false], 2)).toBe(10);
    expect(lessonXp([true, false, false, false], 3)).toBe(0);
  });
  it("gives 3 stars only for a perfect score", () => {
    expect(starsFor(4, 4)).toBe(3);
    expect(starsFor(3, 4)).toBe(2);
    expect(starsFor(1, 4)).toBe(1);
  });
});

describe("daily streak", () => {
  it("starts at 1 on the first active day", () => {
    expect(nextStreak(null, "2026-11-20", 0)).toBe(1);
  });
  it("does not grow twice on the same day", () => {
    expect(nextStreak("2026-11-20", "2026-11-20", 4)).toBe(4);
  });
  it("grows by one on the next day", () => {
    expect(nextStreak("2026-11-19", "2026-11-20", 4)).toBe(5);
  });
  it("resets to 1 after a missed day", () => {
    expect(nextStreak("2026-11-17", "2026-11-20", 9)).toBe(1);
  });
  it("shows 0 once a full day was missed", () => {
    expect(visibleStreak("2026-11-18", "2026-11-20", 6)).toBe(0);
    expect(visibleStreak("2026-11-19", "2026-11-20", 6)).toBe(6);
  });
  it("rejects client dates far from the server date", () => {
    const now = new Date("2026-11-20T12:00:00Z");
    expect(isPlausibleLocalDate("2026-11-21", now)).toBe(true);
    expect(isPlausibleLocalDate("2026-11-25", now)).toBe(false);
  });
});
