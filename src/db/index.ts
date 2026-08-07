import "server-only";

import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { hashPin } from "@/lib/pin-hash";
import { addDays, todayISO } from "@/lib/window";
import {
  DEFAULT_SCORING_WEIGHTS,
  type Guess,
  type GuessPatch,
  type NameCredit,
  type Participant,
  type Result,
  type ScoringWeights,
  type Sex,
  type Sweepstake,
  type SweepstakeStatus,
} from "./schema";
import * as schema from "./schema";

export const GAME_ID = "main";
const DUE_DATE = "2026-08-15";
const DEFAULT_ADMIN_PIN = "2468";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set `d1` to `DB` in .openai/hosting.json.",
    );
  }
  return drizzle(env.DB, { schema });
}

function getD1(): D1Database {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return env.DB;
}

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;

  await getD1().batch([
      getD1().prepare(`CREATE TABLE IF NOT EXISTS sweepstake (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        join_code TEXT NOT NULL,
        admin_pin_hash TEXT NOT NULL,
        due_date TEXT NOT NULL,
        calendar_start TEXT NOT NULL,
        calendar_end TEXT NOT NULL,
        buy_in_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        default_units TEXT NOT NULL,
        status TEXT NOT NULL,
        names_released_at INTEGER,
        scoring_weights TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      getD1().prepare(`CREATE TABLE IF NOT EXISTS participant (
        id TEXT PRIMARY KEY NOT NULL,
        sweepstake_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        display_name_normalised TEXT NOT NULL,
        avatar_key TEXT NOT NULL,
        accent_color TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        pin_attempts INTEGER DEFAULT 0 NOT NULL,
        locked_until INTEGER,
        has_paid INTEGER DEFAULT 0 NOT NULL,
        committed_at INTEGER,
        created_at INTEGER NOT NULL
      )`),
      getD1().prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS participant_game_name_unique ON participant (sweepstake_id, display_name_normalised)",
      ),
      getD1().prepare(`CREATE TABLE IF NOT EXISTS guess (
        id TEXT PRIMARY KEY NOT NULL,
        participant_id TEXT NOT NULL UNIQUE,
        birth_date TEXT,
        birth_minute_of_day INTEGER,
        weight_grams INTEGER,
        length_mm INTEGER,
        sex TEXT,
        first_name TEXT,
        committed_at INTEGER,
        updated_at INTEGER NOT NULL
      )`),
      getD1().prepare(`CREATE TABLE IF NOT EXISTS result (
        sweepstake_id TEXT PRIMARY KEY NOT NULL,
        actual_date TEXT,
        actual_minute_of_day INTEGER,
        actual_weight_grams INTEGER,
        actual_length_mm INTEGER,
        actual_sex TEXT,
        actual_name TEXT,
        announced_at INTEGER
      )`),
      getD1().prepare(`CREATE TABLE IF NOT EXISTS name_credit (
        participant_id TEXT PRIMARY KEY NOT NULL,
        awarded_points INTEGER NOT NULL,
        note TEXT
      )`),
      getD1().prepare(`CREATE TABLE IF NOT EXISTS private_config (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`),
  ]);
  schemaReady = true;
}

type SweepstakeRow = {
  id: string;
  name: string;
  join_code: string;
  admin_pin_hash: string;
  due_date: string;
  calendar_start: string;
  calendar_end: string;
  buy_in_cents: number;
  currency: string;
  default_units: string;
  status: string;
  names_released_at: number | null;
  scoring_weights: string;
  created_at: number;
};

type ParticipantRow = {
  id: string;
  sweepstake_id: string;
  display_name: string;
  display_name_normalised: string;
  avatar_key: string;
  accent_color: string;
  pin_hash: string;
  pin_attempts: number;
  locked_until: number | null;
  has_paid: number;
  committed_at: number | null;
  created_at: number;
};

type GuessRow = {
  id: string;
  participant_id: string;
  birth_date: string | null;
  birth_minute_of_day: number | null;
  weight_grams: number | null;
  length_mm: number | null;
  sex: string | null;
  first_name: string | null;
  committed_at: number | null;
  updated_at: number;
};

type ResultRow = {
  sweepstake_id: string;
  actual_date: string | null;
  actual_minute_of_day: number | null;
  actual_weight_grams: number | null;
  actual_length_mm: number | null;
  actual_sex: string | null;
  actual_name: string | null;
  announced_at: number | null;
};

function dateOrNull(value: number | null): Date | null {
  return value === null ? null : new Date(value);
}

function toSweepstake(row: SweepstakeRow): Sweepstake {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    adminPinHash: row.admin_pin_hash,
    dueDate: row.due_date,
    calendarStart: row.calendar_start,
    calendarEnd: row.calendar_end,
    buyInCents: row.buy_in_cents,
    currency: row.currency,
    defaultUnits: row.default_units,
    status: row.status as SweepstakeStatus,
    namesReleasedAt: dateOrNull(row.names_released_at),
    scoringWeights: JSON.parse(row.scoring_weights) as ScoringWeights,
    createdAt: new Date(row.created_at),
  };
}

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    sweepstakeId: row.sweepstake_id,
    displayName: row.display_name,
    avatarKey: row.avatar_key,
    accentColor: row.accent_color,
    pinHash: row.pin_hash,
    pinAttempts: row.pin_attempts,
    lockedUntil: dateOrNull(row.locked_until),
    hasPaid: row.has_paid === 1,
    committedAt: dateOrNull(row.committed_at),
    createdAt: new Date(row.created_at),
  };
}

function emptyGuess(participantId: string): Guess {
  return {
    id: participantId,
    participantId,
    birthDate: null,
    birthMinuteOfDay: null,
    weightGrams: null,
    lengthMm: null,
    sex: null,
    firstName: null,
    committedAt: null,
    updatedAt: new Date(),
  };
}

function toGuess(row: GuessRow): Guess {
  return {
    id: row.id,
    participantId: row.participant_id,
    birthDate: row.birth_date,
    birthMinuteOfDay: row.birth_minute_of_day,
    weightGrams: row.weight_grams,
    lengthMm: row.length_mm,
    sex: row.sex as Sex | null,
    firstName: row.first_name,
    committedAt: dateOrNull(row.committed_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toResult(row: ResultRow): Result {
  return {
    sweepstakeId: row.sweepstake_id,
    actualDate: row.actual_date,
    actualMinuteOfDay: row.actual_minute_of_day,
    actualWeightGrams: row.actual_weight_grams,
    actualLengthMm: row.actual_length_mm,
    actualSex: row.actual_sex as Sex | null,
    actualName: row.actual_name,
    announcedAt: dateOrNull(row.announced_at),
  };
}

export async function ensureSweepstake(): Promise<Sweepstake> {
  await ensureSchema();
  const existing = await getD1()
    .prepare("SELECT * FROM sweepstake WHERE id = ?")
    .bind(GAME_ID)
    .first<SweepstakeRow>();
  if (existing) return toSweepstake(existing);

  const now = Date.now();
  const today = todayISO();
  const initial = {
    name: "Guess the Lewbner Baby",
    joinCode: "baby",
    adminPinHash: await hashPin(DEFAULT_ADMIN_PIN),
    dueDate: DUE_DATE,
    calendarStart: today < DUE_DATE ? today : DUE_DATE,
    calendarEnd: addDays(DUE_DATE, 14),
  };

  await getD1().batch([
    getD1()
      .prepare(`INSERT OR IGNORE INTO sweepstake (
        id, name, join_code, admin_pin_hash, due_date, calendar_start,
        calendar_end, buy_in_cents, currency, default_units, status,
        names_released_at, scoring_weights, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        GAME_ID,
        initial.name,
        initial.joinCode,
        initial.adminPinHash,
        initial.dueDate,
        initial.calendarStart,
        initial.calendarEnd,
        1000,
        "NZD",
        "metric",
        "open",
        null,
        JSON.stringify(DEFAULT_SCORING_WEIGHTS),
        now,
      ),
    getD1()
      .prepare(`INSERT OR IGNORE INTO result (
        sweepstake_id, actual_date, actual_minute_of_day, actual_weight_grams,
        actual_length_mm, actual_sex, actual_name, announced_at
      ) VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`)
      .bind(GAME_ID),
  ]);

  const created = await getD1()
    .prepare("SELECT * FROM sweepstake WHERE id = ?")
    .bind(GAME_ID)
    .first<SweepstakeRow>();
  if (!created) throw new Error("Could not initialise the sweepstake.");
  return toSweepstake(created);
}

export function readSweepstake(): Promise<Sweepstake> {
  return ensureSweepstake();
}

export async function findParticipantByName(
  normalisedName: string,
): Promise<Participant | null> {
  await ensureSweepstake();
  const row = await getD1()
    .prepare(
      "SELECT * FROM participant WHERE sweepstake_id = ? AND display_name_normalised = ?",
    )
    .bind(GAME_ID, normalisedName)
    .first<ParticipantRow>();
  return row ? toParticipant(row) : null;
}

export async function isNameTaken(normalisedName: string): Promise<boolean> {
  return (await findParticipantByName(normalisedName)) !== null;
}

export class NameTakenError extends Error {}
export class EntriesClosedError extends Error {}

export async function createParticipant(input: {
  displayName: string;
  displayNameNormalised: string;
  avatarKey: string;
  accentColor: string;
  pinHash: string;
}): Promise<Participant> {
  const sweepstake = await ensureSweepstake();
  if (sweepstake.status !== "open") throw new EntriesClosedError();

  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    await getD1().batch([
      getD1()
        .prepare(`INSERT INTO participant (
          id, sweepstake_id, display_name, display_name_normalised, avatar_key,
          accent_color, pin_hash, pin_attempts, locked_until, has_paid,
          committed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, ?)`)
        .bind(
          id,
          GAME_ID,
          input.displayName,
          input.displayNameNormalised,
          input.avatarKey,
          input.accentColor,
          input.pinHash,
          now,
        ),
      getD1()
        .prepare(`INSERT INTO guess (
          id, participant_id, birth_date, birth_minute_of_day, weight_grams,
          length_mm, sex, first_name, committed_at, updated_at
        ) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)`)
        .bind(id, id, now),
    ]);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) throw new NameTakenError();
    throw error;
  }

  const participant = await readParticipant(id);
  if (!participant) throw new Error("Could not create participant.");
  return participant;
}

export async function readParticipant(id: string): Promise<Participant | null> {
  await ensureSweepstake();
  const row = await getD1()
    .prepare("SELECT * FROM participant WHERE id = ?")
    .bind(id)
    .first<ParticipantRow>();
  return row ? toParticipant(row) : null;
}

export async function readGuess(participantId: string): Promise<Guess> {
  await ensureSweepstake();
  let row = await getD1()
    .prepare("SELECT * FROM guess WHERE participant_id = ?")
    .bind(participantId)
    .first<GuessRow>();
  if (row) return toGuess(row);

  const empty = emptyGuess(participantId);
  await getD1()
    .prepare(`INSERT OR IGNORE INTO guess (
      id, participant_id, birth_date, birth_minute_of_day, weight_grams,
      length_mm, sex, first_name, committed_at, updated_at
    ) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)`)
    .bind(participantId, participantId, empty.updatedAt.getTime())
    .run();
  row = await getD1()
    .prepare("SELECT * FROM guess WHERE participant_id = ?")
    .bind(participantId)
    .first<GuessRow>();
  return row ? toGuess(row) : empty;
}

export async function readResult(): Promise<Result | null> {
  await ensureSweepstake();
  const row = await getD1()
    .prepare("SELECT * FROM result WHERE sweepstake_id = ?")
    .bind(GAME_ID)
    .first<ResultRow>();
  return row ? toResult(row) : null;
}

export async function listParticipants(): Promise<Participant[]> {
  await ensureSweepstake();
  const { results } = await getD1()
    .prepare("SELECT * FROM participant WHERE sweepstake_id = ? ORDER BY created_at ASC")
    .bind(GAME_ID)
    .all<ParticipantRow>();
  return results.map(toParticipant);
}

export async function listParticipantGuesses(): Promise<
  Array<{ participant: Participant; guess: Guess; credit: NameCredit | null }>
> {
  await ensureSweepstake();
  const [participants, guesses, credits] = await Promise.all([
    listParticipants(),
    getD1().prepare("SELECT * FROM guess").all<GuessRow>(),
    getD1()
      .prepare("SELECT * FROM name_credit")
      .all<{ participant_id: string; awarded_points: number; note: string | null }>(),
  ]);
  const guessMap = new Map(
    guesses.results.map((row: GuessRow) => [row.participant_id, toGuess(row)]),
  );
  const creditMap = new Map(
    credits.results.map((row: {
      participant_id: string;
      awarded_points: number;
      note: string | null;
    }) => [
      row.participant_id,
      {
        participantId: row.participant_id,
        awardedPoints: row.awarded_points,
        note: row.note,
      } satisfies NameCredit,
    ]),
  );
  return participants.map((participant: Participant) => ({
    participant,
    guess: guessMap.get(participant.id) ?? emptyGuess(participant.id),
    credit: creditMap.get(participant.id) ?? null,
  }));
}

const participantColumns = {
  displayName: "display_name",
  avatarKey: "avatar_key",
  accentColor: "accent_color",
  pinHash: "pin_hash",
  pinAttempts: "pin_attempts",
  lockedUntil: "locked_until",
  hasPaid: "has_paid",
  committedAt: "committed_at",
  createdAt: "created_at",
} as const;

function databaseValue(value: unknown): string | number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value === null || typeof value === "string" || typeof value === "number") return value;
  return JSON.stringify(value);
}

export async function updateParticipant(
  participantId: string,
  patch: Partial<Omit<Participant, "id" | "sweepstakeId">>,
): Promise<void> {
  await ensureSweepstake();
  const entries = Object.entries(patch).filter(
    ([key]) => key in participantColumns,
  ) as Array<[keyof typeof participantColumns, unknown]>;
  if (entries.length === 0) return;
  const assignments = entries.map(([key]) => `${participantColumns[key]} = ?`).join(", ");
  await getD1()
    .prepare(`UPDATE participant SET ${assignments} WHERE id = ?`)
    .bind(...entries.map(([, value]) => databaseValue(value)), participantId)
    .run();
}

export type GuessWriteResult = "ok" | "closed" | "committed";

const guessColumns = {
  birthDate: "birth_date",
  birthMinuteOfDay: "birth_minute_of_day",
  weightGrams: "weight_grams",
  lengthMm: "length_mm",
  sex: "sex",
  firstName: "first_name",
} as const;

export async function updateDraftGuess(
  participantId: string,
  patch: GuessPatch,
): Promise<GuessWriteResult> {
  const game = await ensureSweepstake();
  if (game.status !== "open") return "closed";
  const participant = await readParticipant(participantId);
  if (!participant || participant.committedAt) return "committed";

  const entries = Object.entries(patch).filter(
    ([key]) => key in guessColumns,
  ) as Array<[keyof typeof guessColumns, unknown]>;
  if (entries.length === 0) return "ok";
  const assignments = [
    ...entries.map(([key]) => `${guessColumns[key]} = ?`),
    "updated_at = ?",
  ].join(", ");
  const result = await getD1()
    .prepare(`UPDATE guess SET ${assignments} WHERE participant_id = ? AND committed_at IS NULL`)
    .bind(
      ...entries.map(([, value]) => databaseValue(value)),
      Date.now(),
      participantId,
    )
    .run();
  return result.meta.changes > 0 ? "ok" : "committed";
}

export async function commitParticipant(participantId: string): Promise<boolean> {
  const game = await ensureSweepstake();
  if (game.status !== "open") return false;
  const now = Date.now();
  const [participantResult] = await getD1().batch([
    getD1()
      .prepare("UPDATE participant SET committed_at = ? WHERE id = ? AND committed_at IS NULL")
      .bind(now, participantId),
    getD1()
      .prepare(`UPDATE guess SET committed_at = ?, updated_at = ?
        WHERE participant_id = ?
          AND EXISTS (
            SELECT 1 FROM participant
            WHERE id = ? AND committed_at = ?
          )`)
      .bind(now, now, participantId, participantId, now),
  ]);
  if (participantResult.meta.changes === 0) return false;
  return true;
}

const sweepstakeColumns = {
  name: "name",
  joinCode: "join_code",
  adminPinHash: "admin_pin_hash",
  dueDate: "due_date",
  calendarStart: "calendar_start",
  calendarEnd: "calendar_end",
  buyInCents: "buy_in_cents",
  currency: "currency",
  defaultUnits: "default_units",
  status: "status",
  namesReleasedAt: "names_released_at",
  scoringWeights: "scoring_weights",
} as const;

export async function updateSweepstake(
  patch: Partial<Omit<Sweepstake, "id" | "createdAt">>,
): Promise<void> {
  await ensureSweepstake();
  const entries = Object.entries(patch).filter(
    ([key]) => key in sweepstakeColumns,
  ) as Array<[keyof typeof sweepstakeColumns, unknown]>;
  if (entries.length === 0) return;
  const assignments = entries.map(([key]) => `${sweepstakeColumns[key]} = ?`).join(", ");
  await getD1()
    .prepare(`UPDATE sweepstake SET ${assignments} WHERE id = ?`)
    .bind(...entries.map(([, value]) => databaseValue(value)), GAME_ID)
    .run();
}

export async function saveActualResult(
  input: Omit<Result, "sweepstakeId" | "announcedAt">,
): Promise<void> {
  await ensureSweepstake();
  const anythingKnown = Object.values(input).some((value) => value !== null);
  const announcedAt = anythingKnown ? Date.now() : null;
  const resultUpdate = getD1()
    .prepare(`UPDATE result SET actual_date = ?, actual_minute_of_day = ?,
        actual_weight_grams = ?, actual_length_mm = ?, actual_sex = ?,
        actual_name = ?, announced_at = ? WHERE sweepstake_id = ?`)
    .bind(
      input.actualDate,
      input.actualMinuteOfDay,
      input.actualWeightGrams,
      input.actualLengthMm,
      input.actualSex,
      input.actualName,
      announcedAt,
      GAME_ID,
    );

  if (!anythingKnown) {
    await resultUpdate.run();
    return;
  }

  await getD1().batch([
    resultUpdate,
    getD1()
      .prepare("UPDATE sweepstake SET status = ? WHERE id = ?")
      .bind("revealed", GAME_ID),
  ]);
}

export async function setNameCredit(
  participantId: string,
  points: number,
): Promise<void> {
  await ensureSweepstake();
  if (points <= 0) {
    await getD1()
      .prepare("DELETE FROM name_credit WHERE participant_id = ?")
      .bind(participantId)
      .run();
    return;
  }
  await getD1()
    .prepare(`INSERT INTO name_credit (participant_id, awarded_points, note)
      VALUES (?, ?, NULL)
      ON CONFLICT(participant_id) DO UPDATE SET awarded_points = excluded.awarded_points`)
    .bind(participantId, points)
    .run();
}

let signingSecretPromise: Promise<Uint8Array> | undefined;

function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getSessionSigningSecret(): Promise<Uint8Array> {
  signingSecretPromise ??= (async () => {
    await ensureSweepstake();
    const existing = await getD1()
      .prepare("SELECT value FROM private_config WHERE key = ?")
      .bind("session_secret")
      .first<{ value: string }>();
    if (existing) return new TextEncoder().encode(existing.value);

    const generated = randomSecret();
    await getD1()
      .prepare(
        "INSERT OR IGNORE INTO private_config (key, value, created_at) VALUES (?, ?, ?)",
      )
      .bind("session_secret", generated, Date.now())
      .run();
    const saved = await getD1()
      .prepare("SELECT value FROM private_config WHERE key = ?")
      .bind("session_secret")
      .first<{ value: string }>();
    return new TextEncoder().encode(saved?.value ?? generated);
  })();
  return signingSecretPromise;
}
