import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Sessions are signed JWTs in httpOnly cookies. The participant id never
 * appears anywhere the browser can tamper with it, which matters because the
 * whole visibility model — who may see whose guesses — keys off it.
 *
 * Note that cookies() is async in Next 16; synchronous access was removed.
 */

const PARTICIPANT_COOKIE = "bsw_session";
const ADMIN_COOKIE = "bsw_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // The sweepstake runs for weeks.

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env.local.",
    );
  }
  return new TextEncoder().encode(value);
}

async function sign(payload: Record<string, string>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

/* --------------------------------------------------------- participants -- */

export type Session = { participantId: string; sweepstakeId: string };

export async function createSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(PARTICIPANT_COOKIE, await sign(session), cookieOptions());
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (
      typeof payload.participantId !== "string" ||
      typeof payload.sweepstakeId !== "string"
    ) {
      return null;
    }
    return {
      participantId: payload.participantId,
      sweepstakeId: payload.sweepstakeId,
    };
  } catch {
    // Expired or tampered — treat as signed out rather than erroring.
    return null;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(PARTICIPANT_COOKIE);
}

/* --------------------------------------------------------------- admin -- */

export async function createAdminSession(sweepstakeId: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, await sign({ sweepstakeId }), cookieOptions());
}

export async function getAdminSession(): Promise<string | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sweepstakeId === "string" ? payload.sweepstakeId : null;
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}
