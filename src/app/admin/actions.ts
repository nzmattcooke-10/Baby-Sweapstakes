"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  nameCredit as nameCreditTable,
  participant as participantTable,
  result as resultTable,
  sweepstake as sweepstakeTable,
} from "@/db/schema";
import { getSweepstake } from "@/lib/data";
import { PIN_PROBLEM_MESSAGE, validatePin } from "@/lib/pin";
import { hashPin, verifyPin } from "@/lib/pin-hash";
import {
  createAdminSession,
  getAdminSession,
  clearAdminSession,
} from "@/lib/session";

export type AdminResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<string> {
  const sweepstakeId = await getAdminSession();
  if (!sweepstakeId) throw new Error("Not signed in as host");
  return sweepstakeId;
}

export async function adminSignIn(pin: string): Promise<AdminResult> {
  const sweepstake = await getSweepstake();
  if (!(await verifyPin(sweepstake.adminPinHash, pin))) {
    return { ok: false, error: "That's not the host PIN." };
  }
  await createAdminSession(sweepstake.id);
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminSignOut(): Promise<AdminResult> {
  await clearAdminSession();
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * The button the host taps from a hospital corridor.
 *
 * Deliberately a single action with no confirmation chain — one tap, done.
 * Everything downstream (the guess actions) already refuses to write once
 * status leaves "open", so this is the only thing that has to happen and it
 * has to happen on the first try.
 */
export async function closeEntries(): Promise<AdminResult> {
  const sweepstakeId = await requireAdmin();
  const db = await getDb();
  await db
    .update(sweepstakeTable)
    .set({ status: "closed" })
    .where(eq(sweepstakeTable.id, sweepstakeId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reopenEntries(): Promise<AdminResult> {
  const sweepstakeId = await requireAdmin();
  const db = await getDb();
  await db
    .update(sweepstakeTable)
    .set({ status: "open" })
    .where(eq(sweepstakeTable.id, sweepstakeId));
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Separate from announcing the birth, because families typically announce a
 * name days later. Until this runs, name guesses are never sent to anyone.
 */
export async function releaseNames(): Promise<AdminResult> {
  const sweepstakeId = await requireAdmin();
  const db = await getDb();
  await db
    .update(sweepstakeTable)
    .set({ namesReleasedAt: new Date() })
    .where(eq(sweepstakeTable.id, sweepstakeId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export type ResultInput = {
  actualDate: string | null;
  actualMinuteOfDay: number | null;
  actualWeightGrams: number | null;
  actualLengthMm: number | null;
  actualSex: "boy" | "girl" | null;
  actualName: string | null;
};

/**
 * Saves whatever is known so far. Every field is optional on purpose: the date
 * and time are known hours before an official weight, and the name days after
 * that, so the reveal starts on the day rather than waiting for a full set.
 */
export async function saveResult(input: ResultInput): Promise<AdminResult> {
  const sweepstakeId = await requireAdmin();
  const db = await getDb();

  const anythingKnown = Object.values(input).some((value) => value !== null);

  await db
    .update(resultTable)
    .set({
      ...input,
      announcedAt: anythingKnown ? new Date() : null,
    })
    .where(eq(resultTable.sweepstakeId, sweepstakeId));

  // Announcing the birth closes entries even if the host never pressed the
  // button — which is the likely path, since nobody remembers admin panels
  // during labour.
  if (anythingKnown) {
    await db
      .update(sweepstakeTable)
      .set({ status: "revealed" })
      .where(eq(sweepstakeTable.id, sweepstakeId));
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setPaid(
  participantId: string,
  hasPaid: boolean,
): Promise<AdminResult> {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(participantTable)
    .set({ hasPaid })
    .where(eq(participantTable.id, participantId));
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * With no email there is no self-service recovery, so this is the only way back
 * in for somebody who has forgotten their PIN. It exists from day one rather
 * than being discovered when Nana is locked out.
 */
export async function resetPin(
  participantId: string,
  newPin: string,
): Promise<AdminResult> {
  await requireAdmin();
  const problem = validatePin(newPin);
  if (problem) return { ok: false, error: PIN_PROBLEM_MESSAGE[problem] };

  const db = await getDb();
  await db
    .update(participantTable)
    .set({
      pinHash: await hashPin(newPin),
      pinAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(participantTable.id, participantId));
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * The human override for near-miss names. Automated similarity would rule on
 * Isabelle vs Isabella with total confidence and annoy somebody either way.
 */
export async function awardNameCredit(
  participantId: string,
  points: number,
): Promise<AdminResult> {
  await requireAdmin();
  const db = await getDb();

  if (points <= 0) {
    await db
      .delete(nameCreditTable)
      .where(eq(nameCreditTable.participantId, participantId));
  } else {
    await db
      .insert(nameCreditTable)
      .values({ participantId, awardedPoints: points })
      .onConflictDoUpdate({
        target: nameCreditTable.participantId,
        set: { awardedPoints: points },
      });
  }

  revalidatePath("/results");
  return { ok: true };
}

export async function updateSettings(input: {
  dueDate: string;
  calendarEnd: string;
  buyInCents: number;
  currency: string;
}): Promise<AdminResult> {
  const sweepstakeId = await requireAdmin();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
    return { ok: false, error: "That due date isn't a date." };
  }
  if (input.calendarEnd <= input.dueDate) {
    return { ok: false, error: "The window has to end after the due date." };
  }

  const db = await getDb();
  await db
    .update(sweepstakeTable)
    .set({
      dueDate: input.dueDate,
      calendarEnd: input.calendarEnd,
      buyInCents: Math.max(0, Math.round(input.buyInCents)),
      currency: input.currency,
    })
    .where(eq(sweepstakeTable.id, sweepstakeId));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changeAdminPin(newPin: string): Promise<AdminResult> {
  const sweepstakeId = await requireAdmin();
  const problem = validatePin(newPin);
  if (problem) return { ok: false, error: PIN_PROBLEM_MESSAGE[problem] };

  const db = await getDb();
  await db
    .update(sweepstakeTable)
    .set({ adminPinHash: await hashPin(newPin) })
    .where(eq(sweepstakeTable.id, sweepstakeId));
  return { ok: true };
}
