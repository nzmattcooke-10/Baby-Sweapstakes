import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * All measurements are stored as integers in canonical units — grams,
 * millimetres, and minutes-since-midnight. Scoring is then exact integer
 * arithmetic, and there is no float drift or timezone ambiguity to reason
 * about. Conversion to kg / lb-oz / cm / inches happens only at display time.
 */

export const sexEnum = pgEnum("sex", ["boy", "girl"]);

/**
 * open     — people can still enter and commit guesses
 * closed   — entries locked (host tapped "close entries", or the birth was announced)
 * revealed — the real result is in and the leaderboard is live
 */
export const sweepstakeStatusEnum = pgEnum("sweepstake_status", [
  "open",
  "closed",
  "revealed",
]);

export type ScoringWeights = {
  date: { max: number; perDay: number };
  weight: { max: number; per50g: number };
  name: { max: number };
  time: { max: number; per30min: number };
  sex: { max: number };
  length: { max: number; per5mm: number };
};

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  date: { max: 30, perDay: 5 },
  weight: { max: 25, per50g: 1 },
  name: { max: 20 },
  time: { max: 15, per30min: 1 },
  sex: { max: 10 },
  length: { max: 10, per5mm: 1 },
};

export const sweepstake = pgTable("sweepstake", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  adminPinHash: text("admin_pin_hash").notNull(),

  dueDate: date("due_date").notNull(),
  /**
   * The stored start of the guessing window. The *effective* start is always
   * max(today, calendarStart) — see calendarWindow() in src/lib/window.ts.
   * Days that have passed stop being selectable rather than sitting there as
   * dead squares people can still bet on.
   */
  calendarStart: date("calendar_start").notNull(),
  calendarEnd: date("calendar_end").notNull(),

  buyInCents: integer("buy_in_cents").notNull().default(0),
  currency: text("currency").notNull().default("NZD"),
  defaultUnits: text("default_units").notNull().default("metric"),

  status: sweepstakeStatusEnum("status").notNull().default("open"),
  /**
   * Name guesses stay hidden from everyone — even committed participants —
   * until the host sets this, so nobody can influence the parents. It is a
   * separate action from announcing the birth, because families usually
   * announce a name days later.
   */
  namesReleasedAt: timestamp("names_released_at", { withTimezone: true }),

  scoringWeights: jsonb("scoring_weights")
    .$type<ScoringWeights>()
    .notNull()
    .default(DEFAULT_SCORING_WEIGHTS),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const participant = pgTable("participant", {
  id: uuid("id").primaryKey().defaultRandom(),
  sweepstakeId: uuid("sweepstake_id")
    .notNull()
    .references(() => sweepstake.id, { onDelete: "cascade" }),

  displayName: text("display_name").notNull(),
  avatarKey: text("avatar_key").notNull(),
  accentColor: text("accent_color").notNull(),

  pinHash: text("pin_hash").notNull(),
  /** Reset to 0 on a successful sign-in; 5 failures triggers lockedUntil. */
  pinAttempts: smallint("pin_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),

  hasPaid: boolean("has_paid").notNull().default(false),
  /** Set once, at commit. Its presence is what unlocks the board for them. */
  committedAt: timestamp("committed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One row per participant rather than a row per category: scoring reads all six
 * values together, and it makes commit a single atomic UPDATE. Every guess
 * column is nullable so a partially-filled draft is representable.
 */
export const guess = pgTable("guess", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id")
    .notNull()
    .unique()
    .references(() => participant.id, { onDelete: "cascade" }),

  birthDate: date("birth_date"),
  birthMinuteOfDay: smallint("birth_minute_of_day"),
  weightGrams: integer("weight_grams"),
  lengthMm: integer("length_mm"),
  sex: sexEnum("sex"),
  firstName: text("first_name"),

  committedAt: timestamp("committed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Every actual_* column is nullable on purpose. The host learns the date and
 * time hours before an official weight, and the name days later — so results
 * are entered in stages and each category scores as soon as it is known.
 */
export const result = pgTable("result", {
  sweepstakeId: uuid("sweepstake_id")
    .primaryKey()
    .references(() => sweepstake.id, { onDelete: "cascade" }),

  actualDate: date("actual_date"),
  actualMinuteOfDay: smallint("actual_minute_of_day"),
  actualWeightGrams: integer("actual_weight_grams"),
  actualLengthMm: integer("actual_length_mm"),
  actualSex: sexEnum("actual_sex"),
  actualName: text("actual_name"),

  announcedAt: timestamp("announced_at", { withTimezone: true }),
});

/**
 * Names are never fuzzy-matched automatically — see src/lib/scoring.ts. This
 * records the host's manual "close enough" calls (Isabelle vs Isabella) so a
 * human, not a similarity algorithm, decides who gets the points.
 */
export const nameCredit = pgTable("name_credit", {
  participantId: uuid("participant_id")
    .primaryKey()
    .references(() => participant.id, { onDelete: "cascade" }),
  awardedPoints: smallint("awarded_points").notNull(),
  note: text("note"),
});

export type Sweepstake = typeof sweepstake.$inferSelect;
export type Participant = typeof participant.$inferSelect;
export type Guess = typeof guess.$inferSelect;
export type Result = typeof result.$inferSelect;
export type NameCredit = typeof nameCredit.$inferSelect;
