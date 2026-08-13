/**
 * Plain calendar-date maths for the guessing window.
 *
 * Dates are handled as "YYYY-MM-DD" strings throughout and never as timestamps.
 * A birth date is a calendar fact, not an instant, so parsing one into a Date
 * in the server's locale is how you end up a day out.
 *
 * The one place a real clock matters is "what is today", and that has to be
 * today *for the family*, not for the server. Vercel runs in UTC: at 9am on the
 * 8th in Auckland it is still the 7th in UTC, which would leave a day
 * selectable that has already gone.
 */

export const TIME_ZONE = "Pacific/Auckland";

/** Today's calendar date in the family's timezone, as "YYYY-MM-DD". */
export function todayISO(timeZone: string = TIME_ZONE): string {
  // en-CA formats as YYYY-MM-DD, which saves reassembling the parts by hand.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Parse "YYYY-MM-DD" to a UTC-noon Date — noon keeps DST shifts harmless. */
function toUtcNoon(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function fromUtcNoon(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = toUtcNoon(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtcNoon(d);
}

/** Whole days from `a` to `b`. Negative when `b` is earlier. */
export function daysBetween(a: string, b: string): number {
  const ms = toUtcNoon(b).getTime() - toUtcNoon(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function maxISO(a: string, b: string): string {
  return a > b ? a : b;
}

export function minISO(a: string, b: string): string {
  return a < b ? a : b;
}

export function isPast(iso: string, today = todayISO()): boolean {
  return iso < today;
}

export type CalendarDay = {
  iso: string;
  dayOfMonth: number;
  /** 0 = Monday … 6 = Sunday. */
  weekdayIndex: number;
  monthLabel: string;
  /** True on the first cell of the grid and whenever the month rolls over. */
  startsNewMonth: boolean;
  isDueDate: boolean;
  /** Gone by. Rendered greyed and not selectable. */
  isPast: boolean;
  /** Offset from the due date: negative early, positive late. */
  offsetFromDue: number;
};

export type CalendarWindow = {
  /** Effective start — max(today, stored start). */
  start: string;
  end: string;
  days: CalendarDay[];
  /** Blank cells before the first day so week rows line up under Mon–Sun. */
  leadingBlanks: number;
  dueDate: string;
};

/**
 * Build the guessing grid.
 *
 * The window rolls forward for the *picker*: the effective start is max(today,
 * stored start), so a late baby's passed days drop out rather than sitting there
 * as dead squares people can still bet on. The *board* passes `rollForward:
 * false` and its own earlier start, so a guess whose day has gone by stays on
 * the grid (rendered crossed out) instead of vanishing. `isPast` marks those
 * days either way.
 */
export function calendarWindow(
  storedStart: string,
  end: string,
  dueDate: string,
  today: string = todayISO(),
  { rollForward = true }: { rollForward?: boolean } = {},
): CalendarWindow {
  const start = rollForward ? maxISO(storedStart, today) : storedStart;
  const days: CalendarDay[] = [];

  // A fully-elapsed window (a very late baby) yields no days rather than a
  // backwards range; callers show the "entries have closed" state.
  const span = daysBetween(start, end);
  let previousMonth = "";

  for (let i = 0; i <= span; i++) {
    const iso = addDays(start, i);
    const d = toUtcNoon(iso);
    const monthLabel = new Intl.DateTimeFormat("en-NZ", {
      month: "long",
      timeZone: "UTC",
    }).format(d);

    // getUTCDay is 0 = Sunday; shift so weeks start on Monday.
    const weekdayIndex = (d.getUTCDay() + 6) % 7;

    days.push({
      iso,
      dayOfMonth: d.getUTCDate(),
      weekdayIndex,
      monthLabel,
      startsNewMonth: i === 0 || monthLabel !== previousMonth,
      isDueDate: iso === dueDate,
      isPast: iso < today,
      offsetFromDue: daysBetween(dueDate, iso),
    });
    previousMonth = monthLabel;
  }

  return {
    start,
    end,
    days,
    leadingBlanks: days.length > 0 ? days[0].weekdayIndex : 0,
    dueDate,
  };
}

export const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

/** "Saturday 15 August" — used in the review screen and board tables. */
export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(toUtcNoon(iso));
}

/** "Sat 15 Aug" — used where space is tight. */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(toUtcNoon(iso));
}
