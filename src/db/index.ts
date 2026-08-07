import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Two drivers, one schema.
 *
 * Production runs on Neon over HTTP. Local development runs on PGlite — real
 * Postgres compiled to WebAssembly, persisted to .pglite/ — so the whole app
 * can be built and verified without anyone having created a cloud account
 * first, and without needing Docker or a local Postgres install.
 *
 * The driver is chosen by whether DATABASE_URL is set, and the import is
 * dynamic so the unused one never reaches the production bundle. That is why
 * this is `getDb()` rather than a plain exported `db`: every caller is a server
 * component or route handler and is already async, so the cost is a keyword.
 */

/**
 * Typed as the production driver rather than a union of both.
 *
 * Drizzle's query builders live in pg-core and are identical across pg
 * drivers — only execution differs — but a union of the two database types
 * makes TypeScript fail to resolve overloads like `.returning({ id })`. So
 * PGlite is cast to this shape at the point of construction, which keeps every
 * call site clean and honest about what runs in production.
 */
export type Db = NeonHttpDatabase<typeof schema>;

/**
 * Held on globalThis, not in a module variable.
 *
 * The dev server compiles server components and route handlers into separate
 * module graphs, so a module-level singleton becomes two singletons — and two
 * PGlite instances on one data directory means one of them serves a stale
 * snapshot. That shows up as a route handler disagreeing with a page about
 * what's in the database, which is a deeply confusing bug to chase.
 */
const globalForDb = globalThis as typeof globalThis & {
  __babySweepstakesDb?: Promise<Db>;
};

export function usingPglite(): boolean {
  return !process.env.DATABASE_URL;
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const [{ neon }, { drizzle }] = await Promise.all([
      import("@neondatabase/serverless"),
      import("drizzle-orm/neon-http"),
    ]);
    return drizzle(neon(url), { schema });
  }

  // PGlite is single-process: only one thing may hold the data directory at a
  // time. Running `npm run build`, `db:migrate` or `db:seed` while `npm run
  // dev` is up will abort the running instance, and every query afterwards
  // fails with a bare "RuntimeError: Aborted()". Stop the dev server first, or
  // run `npm run db:reset` to start over. None of this applies in production,
  // where Neon is a real server.
  const [{ PGlite }, { drizzle }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
  ]);
  const client = new PGlite(process.env.PGLITE_DIR ?? ".pglite");
  return drizzle(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  globalForDb.__babySweepstakesDb ??= connect();
  return globalForDb.__babySweepstakesDb;
}

export * from "./schema";
