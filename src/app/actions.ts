"use server";

import { redirect } from "next/navigation";
import {
  createParticipant,
  EntriesClosedError,
  findParticipantByName,
  isNameTaken,
  NameTakenError,
  updateParticipant,
} from "@/db";
import { getSweepstake } from "@/lib/data";
import {
  MAX_ATTEMPTS,
  PIN_PROBLEM_MESSAGE,
  attemptsRemainingMessage,
  isLockedOut,
  lockoutExpiry,
  lockoutMessage,
  validatePin,
} from "@/lib/pin";
import { hashPin, verifyPin } from "@/lib/pin-hash";
import { createSession, clearSession } from "@/lib/session";

/**
 * Display names are unique.
 *
 * The plan had an "add as a new person" escape hatch for two relatives sharing
 * a first name, but it can't actually work: with only a name and a PIN to sign
 * in with, two Sarahs make the sign-in ambiguous and there's nothing to
 * disambiguate on. So a taken name offers the honest choice instead — "that's
 * me, here's my PIN", or pick something distinguishable like "Sarah B".
 */
function normalise(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export type NameCheck =
  | { status: "available" }
  | { status: "taken" }
  | { status: "invalid"; error: string };

export async function checkName(rawName: string): Promise<NameCheck> {
  const name = rawName.trim();
  if (name.length < 2) {
    return { status: "invalid", error: "Give us at least two characters." };
  }
  if (name.length > 30) {
    return { status: "invalid", error: "That name is a bit long — 30 characters max." };
  }

  return (await isNameTaken(normalise(name)))
    ? { status: "taken" }
    : { status: "available" };
}

export type AuthResult = { ok: false; error: string };

// A resized avatar photo is a small square JPEG; anything much over ~300KB of
// base64 means the client didn't downscale, and we don't want that in the row.
const MAX_PHOTO_CHARS = 400_000;

export async function register(
  rawName: string,
  avatarKey: string,
  accentColor: string,
  pin: string,
  avatarPhoto: string | null = null,
): Promise<AuthResult | never> {
  const name = rawName.trim();
  const check = await checkName(name);
  if (check.status === "invalid") return { ok: false, error: check.error };

  if (avatarPhoto !== null) {
    if (
      !/^data:image\/(png|jpe?g|webp);base64,/.test(avatarPhoto) ||
      avatarPhoto.length > MAX_PHOTO_CHARS
    ) {
      return {
        ok: false,
        error: "That photo didn't work — try a smaller image.",
      };
    }
  }
  if (check.status === "taken") {
    return {
      ok: false,
      error: `Somebody's already using "${name}". Sign in as them, or add a surname initial.`,
    };
  }

  const problem = validatePin(pin);
  if (problem) return { ok: false, error: PIN_PROBLEM_MESSAGE[problem] };

  const sweepstake = await getSweepstake();

  // Turning away a latecomer at the door is kinder than letting them build an
  // account and pick an avatar, only to be refused at the first guess.
  if (sweepstake.status !== "open") {
    return {
      ok: false,
      error:
        "Entries have closed — the baby's on the way! You've missed this one, sorry.",
    };
  }

  let created;
  try {
    created = await createParticipant({
      displayName: name,
      displayNameNormalised: normalise(name),
      avatarKey,
      avatarPhoto,
      accentColor,
      pinHash: await hashPin(pin),
    });
  } catch (error) {
    if (error instanceof NameTakenError) {
      return {
        ok: false,
        error: `Somebody's already using "${name}". Sign in as them, or add a surname initial.`,
      };
    }
    if (error instanceof EntriesClosedError) {
      return {
        ok: false,
        error:
          "Entries have closed — the baby's on the way! You've missed this one, sorry.",
      };
    }
    throw error;
  }
  await createSession({
    participantId: created.id,
    sweepstakeId: sweepstake.id,
  });

  redirect("/guess");
}

export async function signIn(
  rawName: string,
  pin: string,
): Promise<AuthResult | never> {
  const sweepstake = await getSweepstake();
  const person = await findParticipantByName(normalise(rawName));

  // Deliberately the same message whether the name is unknown or the PIN is
  // wrong, so this can't be used to enumerate who is playing.
  const generic = { ok: false as const, error: "That name and PIN don't match." };
  if (!person) return generic;

  if (isLockedOut(person.lockedUntil)) {
    return { ok: false, error: lockoutMessage(person.lockedUntil!) };
  }

  if (await verifyPin(person.pinHash, pin)) {
    await updateParticipant(person.id, { pinAttempts: 0, lockedUntil: null });
    await createSession({
      participantId: person.id,
      sweepstakeId: sweepstake.id,
    });
    redirect(person.committedAt ? "/board" : "/guess");
  }

  const attempts = person.pinAttempts + 1;
  const locked = attempts >= MAX_ATTEMPTS;

  await updateParticipant(person.id, {
    pinAttempts: locked ? 0 : attempts,
    lockedUntil: locked ? lockoutExpiry() : null,
  });

  if (locked) return { ok: false, error: lockoutMessage(lockoutExpiry()) };
  return { ok: false, error: attemptsRemainingMessage(attempts) };
}

export async function signOut(): Promise<never> {
  await clearSession();
  redirect("/");
}
