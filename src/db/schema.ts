/**
 * Firestore domain models.
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
