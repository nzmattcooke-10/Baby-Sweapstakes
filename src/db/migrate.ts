/**
 * Applies the generated SQL migrations to whichever driver is configured.
 *
 *   npm run db:migrate
 *
 * With DATABASE_URL set this targets Neon; without it, the local PGlite
 * database in .pglite/.
 */
import { getDb, usingPglite } from "./index";

async function main() {
  const db = await getDb();
  const folder = "./drizzle";

  if (usingPglite()) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder: folder });
    console.log("Migrations applied to local PGlite database (.pglite/)");
  } else {
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder: folder });
    console.log("Migrations applied to Neon");
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
