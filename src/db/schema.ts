import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * D1 domain models.
 *
 * Measurements stay as integers in canonical units — grams, millimetres and
 * minutes since midnight. Calendar dates stay as YYYY-MM-DD strings so no
 * timezone conversion can move a guess to another day.
 */

export type Sex = "boy" | "girl";
export type SweepstakeStatus = "open" | "closed" | "revealed";

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

export type Sweepstake = {
  id: string;
  name: string;
  joinCode: string;
  adminPinHash: string;
  dueDate: string;
  calendarStart: string;
  calendarEnd: string;
  buyInCents: number;
  currency: string;
  defaultUnits: string;
  status: SweepstakeStatus;
  namesReleasedAt: Date | null;
  scoringWeights: ScoringWeights;
  createdAt: Date;
};

export type Participant = {
  id: string;
  sweepstakeId: string;
  displayName: string;
  avatarKey: string;
  accentColor: string;
  pinHash: string;
  pinAttempts: number;
  lockedUntil: Date | null;
  hasPaid: boolean;
  committedAt: Date | null;
  createdAt: Date;
};

export type Guess = {
  id: string;
  participantId: string;
  birthDate: string | null;
  birthMinuteOfDay: number | null;
  weightGrams: number | null;
  lengthMm: number | null;
  sex: Sex | null;
  firstName: string | null;
  committedAt: Date | null;
  updatedAt: Date;
};

export type Result = {
  sweepstakeId: string;
  actualDate: string | null;
  actualMinuteOfDay: number | null;
  actualWeightGrams: number | null;
  actualLengthMm: number | null;
  actualSex: Sex | null;
  actualName: string | null;
  announcedAt: Date | null;
};

export type NameCredit = {
  participantId: string;
  awardedPoints: number;
  note: string | null;
};

export type GuessPatch = Partial<
  Pick<
    Guess,
    | "birthDate"
    | "birthMinuteOfDay"
    | "weightGrams"
    | "lengthMm"
    | "sex"
    | "firstName"
  >
>;

/**
 * The hosted site uses Cloudflare D1. Timestamps are stored as Unix
 * milliseconds and converted to Date objects at the repository boundary;
 * scoring weights are stored as JSON so the rest of the app keeps its typed
 * domain model.
 */
export const sweepstakesTable = sqliteTable("sweepstake", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull(),
  adminPinHash: text("admin_pin_hash").notNull(),
  dueDate: text("due_date").notNull(),
  calendarStart: text("calendar_start").notNull(),
  calendarEnd: text("calendar_end").notNull(),
  buyInCents: integer("buy_in_cents").notNull(),
  currency: text("currency").notNull(),
  defaultUnits: text("default_units").notNull(),
  status: text("status").notNull(),
  namesReleasedAt: integer("names_released_at"),
  scoringWeights: text("scoring_weights").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const participantsTable = sqliteTable(
  "participant",
  {
    id: text("id").primaryKey(),
    sweepstakeId: text("sweepstake_id").notNull(),
    displayName: text("display_name").notNull(),
    displayNameNormalised: text("display_name_normalised").notNull(),
    avatarKey: text("avatar_key").notNull(),
    accentColor: text("accent_color").notNull(),
    pinHash: text("pin_hash").notNull(),
    pinAttempts: integer("pin_attempts").notNull().default(0),
    lockedUntil: integer("locked_until"),
    hasPaid: integer("has_paid", { mode: "boolean" }).notNull().default(false),
    committedAt: integer("committed_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("participant_game_name_unique").on(
      table.sweepstakeId,
      table.displayNameNormalised,
    ),
  ],
);

export const guessesTable = sqliteTable("guess", {
  id: text("id").primaryKey(),
  participantId: text("participant_id").notNull().unique(),
  birthDate: text("birth_date"),
  birthMinuteOfDay: integer("birth_minute_of_day"),
  weightGrams: integer("weight_grams"),
  lengthMm: integer("length_mm"),
  sex: text("sex"),
  firstName: text("first_name"),
  committedAt: integer("committed_at"),
  updatedAt: integer("updated_at").notNull(),
});

export const resultsTable = sqliteTable("result", {
  sweepstakeId: text("sweepstake_id").primaryKey(),
  actualDate: text("actual_date"),
  actualMinuteOfDay: integer("actual_minute_of_day"),
  actualWeightGrams: integer("actual_weight_grams"),
  actualLengthMm: integer("actual_length_mm"),
  actualSex: text("actual_sex"),
  actualName: text("actual_name"),
  announcedAt: integer("announced_at"),
});

export const nameCreditsTable = sqliteTable("name_credit", {
  participantId: text("participant_id").primaryKey(),
  awardedPoints: integer("awarded_points").notNull(),
  note: text("note"),
});

export const privateConfigTable = sqliteTable("private_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: integer("created_at").notNull(),
});
