/**
 * Creates the sweepstake and, optionally, a cast of fake relatives to develop
 * and verify against.
 *
 *   npm run db:seed              # just the sweepstake
 *   npm run db:seed -- --demo    # plus 8 committed relatives
 *
 * The demo participants exist so the board, the visibility rules and the
 * leaderboard maths can be checked against a populated board rather than an
 * empty one. Never run --demo against the real deployment.
 */
import { eq } from "drizzle-orm";
import { AVATARS, ACCENTS } from "../components/avatars/avatar-set";
import { getDb } from "./index";
import { guess, participant, result, sweepstake } from "./schema";
// Argon2 directly rather than via lib/pin-hash: that module carries a
// `server-only` guard, which correctly refuses to load outside the Next
// bundler — and this is a plain CLI script.
import { hash as hashPin } from "@node-rs/argon2";
import { addDays, todayISO } from "../lib/window";

const DUE_DATE = "2026-08-15";
const JOIN_CODE = "baby";
const ADMIN_PIN = "2468";

const DEMO_PEOPLE: Array<{
  name: string;
  date: string;
  minute: number;
  grams: number;
  mm: number;
  sex: "boy" | "girl";
  firstName: string;
}> = [
  { name: "Nana Joy", date: "2026-08-13", minute: 4 * 60 + 30, grams: 3200, mm: 490, sex: "girl", firstName: "Isla" },
  { name: "Grandad Rob", date: "2026-08-15", minute: 9 * 60, grams: 3600, mm: 510, sex: "boy", firstName: "Charlie" },
  { name: "Aunty Pip", date: "2026-08-18", minute: 22 * 60 + 15, grams: 3450, mm: 500, sex: "girl", firstName: "Ava" },
  { name: "Uncle Dave", date: "2026-08-11", minute: 2 * 60, grams: 4100, mm: 535, sex: "boy", firstName: "Max" },
  { name: "Cousin Ell", date: "2026-08-16", minute: 14 * 60 + 45, grams: 3300, mm: 495, sex: "girl", firstName: "Mia" },
  { name: "Sam", date: "2026-08-20", minute: 6 * 60 + 30, grams: 3750, mm: 515, sex: "boy", firstName: "Theo" },
  { name: "Kiri", date: "2026-08-14", minute: 19 * 60, grams: 3050, mm: 480, sex: "girl", firstName: "Nina" },
  { name: "Tama", date: "2026-08-22", minute: 11 * 60 + 30, grams: 3900, mm: 525, sex: "boy", firstName: "Leo" },
];

async function main() {
  const demo = process.argv.includes("--demo");
  const db = await getDb();

  const existing = await db
    .select()
    .from(sweepstake)
    .where(eq(sweepstake.joinCode, JOIN_CODE));

  if (existing.length > 0) {
    console.log("Sweepstake already seeded — nothing to do.");
    return;
  }

  const today = todayISO();
  const [created] = await db
    .insert(sweepstake)
    .values({
      name: "Guess the Lewbner Baby",
      joinCode: JOIN_CODE,
      adminPinHash: await hashPin(ADMIN_PIN),
      dueDate: DUE_DATE,
      // The stored start is only a floor; the effective start is always
      // max(today, this), so seeding in the past is harmless.
      calendarStart: today < DUE_DATE ? today : DUE_DATE,
      calendarEnd: addDays(DUE_DATE, 14),
      buyInCents: 1000,
      currency: "NZD",
      status: "open",
    })
    .returning();

  await db.insert(result).values({ sweepstakeId: created.id });

  console.log(`Created sweepstake "${created.name}"`);
  console.log(`  join code: ${JOIN_CODE}`);
  console.log(`  admin PIN: ${ADMIN_PIN}   (change this before you share the link)`);
  console.log(`  due date:  ${DUE_DATE}`);
  console.log(`  window:    ${created.calendarStart} → ${created.calendarEnd}`);

  if (!demo) return;

  const pinHash = await hashPin("1357");
  for (const [i, person] of DEMO_PEOPLE.entries()) {
    const [p] = await db
      .insert(participant)
      .values({
        sweepstakeId: created.id,
        displayName: person.name,
        avatarKey: AVATARS[i * 3 % AVATARS.length].key,
        accentColor: ACCENTS[i % ACCENTS.length].key,
        pinHash,
        hasPaid: i % 3 !== 0,
        committedAt: new Date(),
      })
      .returning();

    await db.insert(guess).values({
      participantId: p.id,
      birthDate: person.date,
      birthMinuteOfDay: person.minute,
      weightGrams: person.grams,
      lengthMm: person.mm,
      sex: person.sex,
      firstName: person.firstName,
      committedAt: new Date(),
    });
  }

  // One participant who has *not* committed, so the locked state of the board
  // can be checked without going through onboarding again every reset. This is
  // the account the visibility rules get verified against.
  const [me] = await db
    .insert(participant)
    .values({
      sweepstakeId: created.id,
      displayName: "Test Visitor",
      avatarKey: AVATARS[2].key,
      accentColor: ACCENTS[6].key,
      pinHash: await hashPin("8351"),
    })
    .returning();
  await db.insert(guess).values({ participantId: me.id });

  console.log(`Added ${DEMO_PEOPLE.length} demo relatives (everyone's PIN is 1357).`);
  console.log(`Added "Test Visitor" (PIN 8351), uncommitted, for testing the locked board.`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
