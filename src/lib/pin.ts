/**
 * PIN rules and copy — no hashing.
 *
 * The Argon2 binding lives in pin-hash.ts instead, because it's a native
 * module: the moment a client component imports anything from here (the PIN
 * length, a validation message), a combined module drags Argon2 into the
 * browser bundle and the build fails. Keeping the pure half separate means the
 * form can share the exact same rules the server enforces.
 */

export const PIN_LENGTH = 4;
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

/**
 * Only the genuinely trivial patterns. It's tempting to also ban recent years,
 * but this is a family game played by people up to their eighties — an
 * over-strict PIN policy is a real accessibility cost for a marginal security
 * gain, and the lockout is doing the actual work.
 */
const WEAK_PINS = new Set([
  "0000", "1111", "2222", "3333", "4444",
  "5555", "6666", "7777", "8888", "9999",
  "0123", "1234", "2345", "3456", "4567",
  "5678", "6789", "9876", "4321", "1212",
]);

export type PinProblem = "length" | "digits" | "weak";

export function validatePin(pin: string): PinProblem | null {
  if (pin.length !== PIN_LENGTH) return "length";
  if (!/^\d+$/.test(pin)) return "digits";
  if (WEAK_PINS.has(pin)) return "weak";
  return null;
}

export const PIN_PROBLEM_MESSAGE: Record<PinProblem, string> = {
  length: `Your PIN needs to be exactly ${PIN_LENGTH} digits.`,
  digits: "Your PIN can only contain numbers.",
  weak: "That PIN is a bit too easy to guess — try another four digits.",
};

export function isLockedOut(lockedUntil: Date | null): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > Date.now();
}

export function lockoutExpiry(): Date {
  return new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
}

/** Friendly, non-shaming wording with the remaining wait spelled out. */
export function lockoutMessage(lockedUntil: Date): string {
  const minutes = Math.max(
    1,
    Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000),
  );
  return `Too many tries. Have another go in ${minutes} minute${
    minutes === 1 ? "" : "s"
  }, or ask the host to reset your PIN.`;
}

export function attemptsRemainingMessage(attempts: number): string {
  const left = MAX_ATTEMPTS - attempts;
  if (left <= 0) return "";
  if (left === 1) return "That's not right — one more try before it locks.";
  return `That's not right — ${left} tries left.`;
}
