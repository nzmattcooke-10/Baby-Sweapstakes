"use server";

import { revalidatePath } from "next/cache";
import {
  deleteParticipant,
  saveActualResult,
  updateParticipant,
  updateSweepstake,
} from "@/db";
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
  await requireAdmin();
  await updateSweepstake({ status: "closed" });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reopenEntries(): Promise<AdminResult> {
  await requireAdmin();
  await updateSweepstake({ status: "open" });
  revalidatePath("/", "layout");
  return { ok: true };
}

export type ResultInput = {
  actualDate: string | null;
  actualMinuteOfDay: number | null;
  actualWeightGrams: number | null;
  actualLengthMm: number | null;
  actualSex: "boy" | "girl" | null;
  /** The baby's name, for the announcement. Never scored — nobody guesses it. */
  actualName: string | null;
};

/**
 * Saves whatever is known so far. Every field is optional on purpose: the date
 * and time are known hours before an official weight, so the reveal starts on
 * the day rather than waiting for a full set.
 */
export async function saveResult(input: ResultInput): Promise<AdminResult> {
  await requireAdmin();
  const actualName = input.actualName?.trim() || null;
  if (actualName !== null && actualName.length > 40) {
    return { ok: false, error: "That name is a bit long — 40 characters max." };
  }
  await saveActualResult({ ...input, actualName });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setPaid(
  participantId: string,
  hasPaid: boolean,
): Promise<AdminResult> {
  await requireAdmin();
  await updateParticipant(participantId, { hasPaid });
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Delete a player and their guesses outright — for clearing out test profiles.
 * Irreversible, so the UI guards it behind a confirm step. Revalidates the
 * whole tree because the removed person also drops off the board and scores.
 */
export async function deleteUser(participantId: string): Promise<AdminResult> {
  await requireAdmin();
  await deleteParticipant(participantId);
  revalidatePath("/", "layout");
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

  await updateParticipant(participantId, {
    pinHash: await hashPin(newPin),
    pinAttempts: 0,
    lockedUntil: null,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateSettings(input: {
  dueDate: string;
  calendarEnd: string;
  buyInCents: number;
  currency: string;
}): Promise<AdminResult> {
  await requireAdmin();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
    return { ok: false, error: "That due date isn't a date." };
  }
  if (input.calendarEnd <= input.dueDate) {
    return { ok: false, error: "The window has to end after the due date." };
  }

  await updateSweepstake({
    dueDate: input.dueDate,
    calendarEnd: input.calendarEnd,
    buyInCents: Math.max(0, Math.round(input.buyInCents)),
    currency: input.currency,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changeAdminPin(newPin: string): Promise<AdminResult> {
  await requireAdmin();
  const problem = validatePin(newPin);
  if (problem) return { ok: false, error: PIN_PROBLEM_MESSAGE[problem] };

  await updateSweepstake({ adminPinHash: await hashPin(newPin) });
  return { ok: true };
}
