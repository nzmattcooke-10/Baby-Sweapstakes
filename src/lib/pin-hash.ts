import "server-only";

const ITERATIONS = 210_000;
const KEY_BYTES = 32;

function encode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decode(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const saltBuffer = salt.slice().buffer as ArrayBuffer;
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations },
    material,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${encode(salt)}$${encode(hash)}`;
}

export async function verifyPin(pinHash: string, pin: string): Promise<boolean> {
  try {
    const [algorithm, iterationText, saltText, expectedText] = pinHash.split("$");
    const iterations = Number(iterationText);
    if (
      algorithm !== "pbkdf2-sha256" ||
      !Number.isInteger(iterations) ||
      iterations < 100_000 ||
      !saltText ||
      !expectedText
    ) {
      return false;
    }
    const expected = decode(expectedText);
    const actual = await derive(pin, decode(saltText), iterations);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
      difference |= actual[index] ^ expected[index];
    }
    return difference === 0;
  } catch {
    return false;
  }
}
