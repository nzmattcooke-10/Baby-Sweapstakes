import { describe, expect, it } from "vitest";
import { addDays, calendarWindow, daysBetween, maxISO } from "./window";

const START = "2026-08-07";
const END = "2026-08-29";
const DUE = "2026-08-15";

describe("date arithmetic", () => {
  it("adds days across a month boundary", () => {
    expect(addDays("2026-08-29", 3)).toBe("2026-09-01");
    expect(addDays("2026-09-01", -3)).toBe("2026-08-29");
  });

  it("measures signed distance between dates", () => {
    expect(daysBetween(DUE, "2026-08-20")).toBe(5);
    expect(daysBetween(DUE, "2026-08-10")).toBe(-5);
    expect(daysBetween(DUE, DUE)).toBe(0);
  });

  it("compares ISO dates lexicographically", () => {
    expect(maxISO("2026-08-07", "2026-08-10")).toBe("2026-08-10");
  });
});

describe("calendar window", () => {
  it("spans the full range when nothing has passed", () => {
    const w = calendarWindow(START, END, DUE, START);
    expect(w.start).toBe(START);
    expect(w.days).toHaveLength(23);
    expect(w.days.every((d) => !d.isPast)).toBe(true);
  });

  it("rolls the start forward past days that have gone", () => {
    const w = calendarWindow(START, END, DUE, "2026-08-12");
    expect(w.start).toBe("2026-08-12");
    expect(w.days[0].iso).toBe("2026-08-12");
    expect(w.days).toHaveLength(18);
  });

  it("never rolls backwards before the stored start", () => {
    const w = calendarWindow(START, END, DUE, "2026-08-01");
    expect(w.start).toBe(START);
  });

  it("keeps passed days with rollForward:false (board grid)", () => {
    // The board starts before today so a guess whose day has gone stays on the
    // grid, flagged isPast, instead of dropping off as the picker's would.
    const w = calendarWindow("2026-08-10", END, DUE, "2026-08-14", {
      rollForward: false,
    });
    expect(w.start).toBe("2026-08-10");
    expect(w.days[0].iso).toBe("2026-08-10");
    expect(w.days[0].isPast).toBe(true);
    expect(w.days.find((d) => d.iso === "2026-08-14")?.isPast).toBe(false);
  });

  it("flags the due date exactly once", () => {
    const w = calendarWindow(START, END, DUE, START);
    expect(w.days.filter((d) => d.isDueDate)).toHaveLength(1);
    expect(w.days.find((d) => d.isDueDate)?.iso).toBe(DUE);
  });

  it("computes the offset from the due date", () => {
    const w = calendarWindow(START, END, DUE, START);
    expect(w.days[0].offsetFromDue).toBe(-8);
    expect(w.days.at(-1)?.offsetFromDue).toBe(14);
  });

  it("aligns the grid to Monday-start weeks", () => {
    // 7 Aug 2026 is a Friday — index 4 in a Monday-first week.
    const w = calendarWindow(START, END, DUE, START);
    expect(w.days[0].weekdayIndex).toBe(4);
    expect(w.leadingBlanks).toBe(4);
  });

  it("marks the month rollover for the label", () => {
    const w = calendarWindow(START, "2026-09-05", DUE, START);
    const newMonths = w.days.filter((d) => d.startsNewMonth);
    expect(newMonths).toHaveLength(2);
    expect(newMonths[0].iso).toBe(START);
    expect(newMonths[1].iso).toBe("2026-09-01");
  });

  it("yields no days once the whole window has elapsed", () => {
    const w = calendarWindow(START, END, DUE, "2026-09-10");
    expect(w.days).toHaveLength(0);
  });
});
