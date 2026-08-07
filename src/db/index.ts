import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import {
  Firestore,
  Timestamp,
  getFirestore,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase-admin/firestore";
import { hashPin } from "@/lib/pin-hash";
import { addDays, todayISO } from "@/lib/window";
import {
  DEFAULT_SCORING_WEIGHTS,
  type Guess,
  type GuessPatch,
  type NameCredit,
  type Participant,
  type Result,
  type Sweepstake,
} from "./schema";

export const GAME_ID = "main";
const DUE_DATE = "2026-08-15";
const DEFAULT_ADMIN_PIN = "2468";

const firebaseGlobal = globalThis as typeof globalThis & {
  lewbnerFirestore?: Firestore;
};

export function getDb(): Firestore {
  if (firebaseGlobal.lewbnerFirestore) return firebaseGlobal.lewbnerFirestore;
  const app =
    getApps()[0] ??
    initializeApp(
      process.env.FIRESTORE_EMULATOR_HOST
        ? { projectId: process.env.FIREBASE_PROJECT_ID ?? "demo-lewbner" }
        : { credential: applicationDefault() },
    );
  const firestore = getFirestore(app);
  firestore.settings({ ignoreUndefinedProperties: true });
  firebaseGlobal.lewbnerFirestore = firestore;
  return firestore;
}

function gameRef() {
  return getDb().collection("sweepstakes").doc(GAME_ID);
}

function participantsRef() {
  return gameRef().collection("participants");
}

function guessesRef() {
  return gameRef().collection("guesses");
}

function namesRef() {
  return gameRef().collection("names");
}

function resultRef() {
  return gameRef().collection("results").doc("current");
}

function creditsRef() {
  return gameRef().collection("nameCredits");
}

function asDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return null;
}

function dataOf(snapshot: DocumentSnapshot): DocumentData {
  const data = snapshot.data();
  if (!data) throw new Error(`Firestore document ${snapshot.ref.path} is missing.`);
  return data;
}

function toSweepstake(snapshot: DocumentSnapshot): Sweepstake {
  const data = dataOf(snapshot);
  return {
    id: snapshot.id,
    name: data.name,
    joinCode: data.joinCode,
    adminPinHash: data.adminPinHash,
    dueDate: data.dueDate,
    calendarStart: data.calendarStart,
    calendarEnd: data.calendarEnd,
    buyInCents: data.buyInCents,
    currency: data.currency,
    defaultUnits: data.defaultUnits,
    status: data.status,
    namesReleasedAt: asDate(data.namesReleasedAt),
    scoringWeights: data.scoringWeights,
    createdAt: asDate(data.createdAt) ?? new Date(0),
  };
}

function toParticipant(snapshot: DocumentSnapshot): Participant {
  const data = dataOf(snapshot);
  return {
    id: snapshot.id,
    sweepstakeId: GAME_ID,
    displayName: data.displayName,
    avatarKey: data.avatarKey,
    accentColor: data.accentColor,
    pinHash: data.pinHash,
    pinAttempts: data.pinAttempts ?? 0,
    lockedUntil: asDate(data.lockedUntil),
    hasPaid: data.hasPaid ?? false,
    committedAt: asDate(data.committedAt),
    createdAt: asDate(data.createdAt) ?? new Date(0),
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

function toGuess(snapshot: DocumentSnapshot): Guess {
  const data = dataOf(snapshot);
  return {
    id: snapshot.id,
    participantId: snapshot.id,
    birthDate: data.birthDate ?? null,
    birthMinuteOfDay: data.birthMinuteOfDay ?? null,
    weightGrams: data.weightGrams ?? null,
    lengthMm: data.lengthMm ?? null,
    sex: data.sex ?? null,
    firstName: data.firstName ?? null,
    committedAt: asDate(data.committedAt),
    updatedAt: asDate(data.updatedAt) ?? new Date(0),
  };
}

function toResult(snapshot: DocumentSnapshot): Result {
  const data = dataOf(snapshot);
  return {
    sweepstakeId: GAME_ID,
    actualDate: data.actualDate ?? null,
    actualMinuteOfDay: data.actualMinuteOfDay ?? null,
    actualWeightGrams: data.actualWeightGrams ?? null,
    actualLengthMm: data.actualLengthMm ?? null,
    actualSex: data.actualSex ?? null,
    actualName: data.actualName ?? null,
    announcedAt: asDate(data.announcedAt),
  };
}

export async function ensureSweepstake(): Promise<Sweepstake> {
  const ref = gameRef();
  const existing = await ref.get();
  if (existing.exists) return toSweepstake(existing);

  const now = new Date();
  const today = todayISO();
  const initial = {
    name: "Guess the Lewbner Baby",
    joinCode: "baby",
    adminPinHash: await hashPin(DEFAULT_ADMIN_PIN),
    dueDate: DUE_DATE,
    calendarStart: today < DUE_DATE ? today : DUE_DATE,
    calendarEnd: addDays(DUE_DATE, 14),
    buyInCents: 1000,
    currency: "NZD",
    defaultUnits: "metric",
    status: "open",
    namesReleasedAt: null,
    scoringWeights: DEFAULT_SCORING_WEIGHTS,
    createdAt: now,
  } satisfies Omit<Sweepstake, "id">;

  await getDb().runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    if (current.exists) return;
    transaction.create(ref, initial);
    transaction.create(resultRef(), {
      actualDate: null,
      actualMinuteOfDay: null,
      actualWeightGrams: null,
      actualLengthMm: null,
      actualSex: null,
      actualName: null,
      announcedAt: null,
    });
  });

  return toSweepstake(await ref.get());
}

export async function readSweepstake(): Promise<Sweepstake> {
  return ensureSweepstake();
}

function nameKey(normalisedName: string): string {
  return createHash("sha256").update(normalisedName).digest("hex");
}

export async function findParticipantByName(
  normalisedName: string,
): Promise<Participant | null> {
  const guard = await namesRef().doc(nameKey(normalisedName)).get();
  if (!guard.exists) return null;
  const participantId = guard.data()?.participantId;
  if (typeof participantId !== "string") return null;
  return readParticipant(participantId);
}

export async function isNameTaken(normalisedName: string): Promise<boolean> {
  return (await namesRef().doc(nameKey(normalisedName)).get()).exists;
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
  const participantDoc = participantsRef().doc();
  const guessDoc = guessesRef().doc(participantDoc.id);
  const guard = namesRef().doc(nameKey(input.displayNameNormalised));
  const now = new Date();
  const participantData = {
    displayName: input.displayName,
    displayNameNormalised: input.displayNameNormalised,
    avatarKey: input.avatarKey,
    accentColor: input.accentColor,
    pinHash: input.pinHash,
    pinAttempts: 0,
    lockedUntil: null,
    hasPaid: false,
    committedAt: null,
    createdAt: now,
  };

  await getDb().runTransaction(async (transaction) => {
    const [game, existingName] = await Promise.all([
      transaction.get(gameRef()),
      transaction.get(guard),
    ]);
    if (!game.exists || game.data()?.status !== "open") {
      throw new EntriesClosedError();
    }
    if (existingName.exists) throw new NameTakenError();
    transaction.create(guard, { participantId: participantDoc.id });
    transaction.create(participantDoc, participantData);
    transaction.create(guessDoc, {
      birthDate: null,
      birthMinuteOfDay: null,
      weightGrams: null,
      lengthMm: null,
      sex: null,
      firstName: null,
      committedAt: null,
      updatedAt: now,
    });
  });

  return toParticipant(await participantDoc.get());
}

export async function readParticipant(id: string): Promise<Participant | null> {
  const snapshot = await participantsRef().doc(id).get();
  return snapshot.exists ? toParticipant(snapshot) : null;
}

export async function readGuess(participantId: string): Promise<Guess> {
  const ref = guessesRef().doc(participantId);
  const snapshot = await ref.get();
  if (snapshot.exists) return toGuess(snapshot);
  const empty = emptyGuess(participantId);
  await ref.set({
    birthDate: null,
    birthMinuteOfDay: null,
    weightGrams: null,
    lengthMm: null,
    sex: null,
    firstName: null,
    committedAt: null,
    updatedAt: empty.updatedAt,
  });
  return empty;
}

export async function readResult(): Promise<Result | null> {
  const snapshot = await resultRef().get();
  return snapshot.exists ? toResult(snapshot) : null;
}

export async function listParticipants(): Promise<Participant[]> {
  const snapshot = await participantsRef().orderBy("createdAt", "asc").get();
  return snapshot.docs.map(toParticipant);
}

export async function listParticipantGuesses(): Promise<
  Array<{ participant: Participant; guess: Guess; credit: NameCredit | null }>
> {
  const [participants, guesses, credits] = await Promise.all([
    listParticipants(),
    guessesRef().get(),
    creditsRef().get(),
  ]);
  const guessMap = new Map(guesses.docs.map((doc) => [doc.id, toGuess(doc)]));
  const creditMap = new Map(
    credits.docs.map((doc) => [
      doc.id,
      {
        participantId: doc.id,
        awardedPoints: doc.data().awardedPoints,
        note: doc.data().note ?? null,
      } satisfies NameCredit,
    ]),
  );
  return participants.map((participant) => ({
    participant,
    guess: guessMap.get(participant.id) ?? emptyGuess(participant.id),
    credit: creditMap.get(participant.id) ?? null,
  }));
}

export async function updateParticipant(
  participantId: string,
  patch: Partial<Omit<Participant, "id" | "sweepstakeId">>,
): Promise<void> {
  await participantsRef().doc(participantId).update(patch);
}

export type GuessWriteResult = "ok" | "closed" | "committed";

export async function updateDraftGuess(
  participantId: string,
  patch: GuessPatch,
): Promise<GuessWriteResult> {
  return getDb().runTransaction(async (transaction) => {
    const participant = participantsRef().doc(participantId);
    const guess = guessesRef().doc(participantId);
    const [gameSnapshot, participantSnapshot, guessSnapshot] = await Promise.all([
      transaction.get(gameRef()),
      transaction.get(participant),
      transaction.get(guess),
    ]);
    if (gameSnapshot.data()?.status !== "open") return "closed";
    if (
      !participantSnapshot.exists ||
      participantSnapshot.data()?.committedAt ||
      guessSnapshot.data()?.committedAt
    ) {
      return "committed";
    }
    transaction.update(guess, { ...patch, updatedAt: new Date() });
    return "ok";
  });
}

export async function commitParticipant(participantId: string): Promise<boolean> {
  return getDb().runTransaction(async (transaction) => {
    const participant = participantsRef().doc(participantId);
    const guess = guessesRef().doc(participantId);
    const [gameSnapshot, participantSnapshot] = await Promise.all([
      transaction.get(gameRef()),
      transaction.get(participant),
    ]);
    if (gameSnapshot.data()?.status !== "open") return false;
    if (!participantSnapshot.exists || participantSnapshot.data()?.committedAt) {
      return false;
    }
    const now = new Date();
    transaction.update(participant, { committedAt: now });
    transaction.update(guess, { committedAt: now, updatedAt: now });
    return true;
  });
}

export async function updateSweepstake(
  patch: Partial<Omit<Sweepstake, "id" | "createdAt">>,
): Promise<void> {
  await gameRef().update(patch);
}

export async function saveActualResult(
  input: Omit<Result, "sweepstakeId" | "announcedAt">,
): Promise<void> {
  const anythingKnown = Object.values(input).some((value) => value !== null);
  const batch = getDb().batch();
  batch.set(
    resultRef(),
    { ...input, announcedAt: anythingKnown ? new Date() : null },
    { merge: true },
  );
  if (anythingKnown) batch.update(gameRef(), { status: "revealed" });
  await batch.commit();
}

export async function setNameCredit(
  participantId: string,
  points: number,
): Promise<void> {
  const ref = creditsRef().doc(participantId);
  if (points <= 0) await ref.delete();
  else await ref.set({ awardedPoints: points, note: null });
}

let signingSecretPromise: Promise<Uint8Array> | undefined;

export function getSessionSigningSecret(): Promise<Uint8Array> {
  const configured = process.env.SESSION_SECRET;
  if (configured) return Promise.resolve(new TextEncoder().encode(configured));
  signingSecretPromise ??= getDb().runTransaction(async (transaction) => {
    const ref = gameRef().collection("private").doc("session");
    const existing = await transaction.get(ref);
    const saved = existing.data()?.secret;
    if (typeof saved === "string") return new TextEncoder().encode(saved);
    const generated = randomBytes(32).toString("base64");
    transaction.create(ref, { secret: generated, createdAt: new Date() });
    return new TextEncoder().encode(generated);
  });
  return signingSecretPromise;
}
