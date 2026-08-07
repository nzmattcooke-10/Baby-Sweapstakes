import "server-only";

import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id, kept in its own module because it is a native binding and must
 * never be reachable from a client component. The `server-only` import turns
 * an accidental client import into a build error rather than a broken bundle.
 */

export function hashPin(pin: string): Promise<string> {
  return hash(pin);
}

export async function verifyPin(
  pinHash: string,
  pin: string,
): Promise<boolean> {
  try {
    return await verify(pinHash, pin);
  } catch {
    // A malformed stored hash should read as "wrong PIN", never as a crash
    // that leaks a stack trace to somebody trying to sign in.
    return false;
  }
}
