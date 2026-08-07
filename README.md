# Guess the Lewbner Baby

A family guessing game for the arrival of a baby. Everyone guesses the **date,
time, weight, length, sex and first name**; nobody sees anyone else's guesses
until they've locked in their own.

Due date: **15 August 2026**. Guessing window: 7–29 August.

---

## Run it locally

```bash
npm install
npm run db:reset   # creates the local database and 8 demo relatives
npm run dev
```

Open http://localhost:3000.

No database account is needed to develop: with `DATABASE_URL` unset the app runs
on **PGlite**, real Postgres compiled to WebAssembly, stored in `.pglite/`.

The demo data gives you:

| Who | PIN | State |
|---|---|---|
| Nana Joy, Grandad Rob, Aunty Pip, Uncle Dave, Cousin Ell, Sam, Kiri, Tama | `1357` | committed |
| Test Visitor | `8351` | **not** committed — use this to see the locked board |
| Host tools (`/admin`) | `2468` | — |

> **One PGlite gotcha.** It's single-process. Running `npm run build`,
> `db:migrate` or `db:seed` *while `npm run dev` is running* aborts the live
> instance, and every query afterwards fails with `RuntimeError: Aborted()`.
> Stop the dev server first, or run `npm run db:reset` to start clean. This
> doesn't apply in production, where Neon is a real server.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Unit tests for the scoring, units and calendar maths |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run db:reset` | Wipe and rebuild the local database with demo data |
| `npm run db:generate` | New SQL migration after a schema change |
| `npm run db:migrate` | Apply migrations (local or Neon) |

`npx tsx scripts/preview-baby.tsx out.html` renders the baby illustration across
the full range of both sliders to a standalone HTML file — handy if you want to
adjust how it looks.

---

## Deploying

You'll need free **Neon** and **Vercel** accounts. Create these yourself — the
credentials shouldn't pass through anyone else.

1. **Neon** — sign up at https://console.neon.tech, create a project, and copy
   the **pooled** connection string (its host contains `-pooler`).
2. **Vercel** — import this repository, and set two environment variables:
   - `DATABASE_URL` — the Neon string from step 1
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`
3. Deploy, then from your machine, pointed at the same database, run:
   ```bash
   DATABASE_URL="<your neon string>" npm run db:migrate
   DATABASE_URL="<your neon string>" npm run db:seed
   ```
   (`db:seed` without `--demo` creates the sweepstake only — no fake relatives.)
4. Open `/admin`, sign in with the seeded PIN, and **change it immediately**.
   Set the real due date and buy-in while you're there.
5. Send the family the link.

### Why Neon rather than Supabase

Supabase's free tier pauses a project after 7 days of inactivity and needs a
manual restore. This app sits idle for weeks waiting for a baby, so a relative
opening the link would find a dead site. Neon also suspends, but wakes on the
next request with no intervention.

---

## How it works

### The visibility rules

The heart of the game, and the one thing that must not be sloppy. There are four
states, all enforced **server-side in `src/lib/board-access.ts`** by leaving data
out of the payload — never by hiding it in the UI:

| Stage | You can see |
|---|---|
| Not signed in | Nothing (401) |
| Signed in, not committed | Only "7 of 12 have locked in" |
| Committed | Everyone's date, time, weight, length, sex — **not names** |
| Host releases names | …plus everyone's name guesses |
| Host enters the result | …plus scores and the leaderboard |

`firstName` is an *optional* property that is **absent** before release, not
null or blank — there is no field to accidentally render or serialise. The
pre-commit teaser draws invented placeholder shapes; the real board is never
sent and blurred.

`GET /api/board` exists so this can be checked against the raw JSON rather than
the rendered page. Verifying through the UI proves nothing.

### Releasing names is separate from announcing the birth

Families usually announce a name days after the arrival, so scoring lands in two
waves — five categories at the birth, the name whenever it's revealed. The
result form takes partial answers for the same reason: the host knows the date
and time hours before an official weight.

### The baby illustration

One parameterised SVG (`src/components/baby/`) drives every toy. Two rules:

1. **The head never changes size.** Weight goes into the torso, cheeks and
   limbs; length into the torso and legs. A head that inflates with the slider
   stops reading as a chubby baby and starts reading as a medical diagram.
2. **The drawing stops exaggerating before the numbers do.** The slider reports
   6 kg but the illustration only travels ~80% of its visual range, so the
   extremes stay charming.

### Accessibility

Targets WCAG 2.2 AA. `axe-core` reports zero violations on every route, in both
the locked and unlocked board states.

- Every slider toy is a real `<input type="range">` with a paired numeric field,
  so nobody has to hit a value by dragging. Values are announced through
  `aria-valuetext`; the running commentary is separately debounced into a live
  region so dragging doesn't produce a stream of interruptions.
- Each board panel offers a **list view** as a genuine peer of the picture — it
  serves screen readers and low vision, and it's the nicer view on a small
  phone. Only one of the two is ever in the accessibility tree.
- Avatars on the board are real buttons rendered in *value* order —
  chronological or ascending — so tabbing reads sensibly whatever the pixels do.
  Decorative parts (artwork, axis ticks, grid numbers) are `aria-hidden`; the
  interactive parts are not.
- Colour is never the only signal. Reflows to 320px with no horizontal scroll.
  Under `prefers-reduced-motion` the baby still morphs — that's content — but
  the flourishes stop.

### Racing the actual baby

- "Close entries" is one enormous button at the top of `/admin`, with no
  confirmation chain — designed for a tired host, one-handed, on bad reception.
- Entries close **server-side**, so a save from a page loaded moments earlier is
  rejected with a clear message rather than silently lost.
- Announcing the birth closes entries automatically, since nobody remembers
  admin panels during labour.
- Latecomers are turned away at registration rather than after picking an avatar.

### Scoring

| Category | Max | Falls off by |
|---|---|---|
| Date | 30 | 5 per day |
| Weight | 25 | 1 per 50 g |
| Name | 20 | exact match only |
| Time | 15 | 1 per 30 min |
| Sex | 10 | exact |
| Length | 10 | 1 per 5 mm |

Ties share a rank. Every category also names its own closest guess, so more
people get a moment.

**Names are never fuzzy-matched.** An algorithm would rule on *Isabelle* vs
*Isabella* with total confidence and annoy somebody either way, so exact matches
score automatically and the host awards close-enough credit by hand from
`/admin`.

### PINs

Four digits is only 10,000 combinations, so the lockout does the real work: five
wrong tries parks that name for 15 minutes. Obvious PINs (`1234`, `0000`…) are
refused. With no email there's no self-service recovery, so **the host resets a
forgotten PIN** from `/admin` — that clears the lockout immediately.

---

## Still to set up

- The **family roster** — people self-register, so nothing is needed up front.
- **Buy-in and currency** — defaults to NZD $10, changeable in `/admin`. The app
  never touches money; it only tallies who has paid.
- **Who administers it.** If you're a parent, note you'll see every name guess
  the moment you release them. Consider handing that key to somebody else.
