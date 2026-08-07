# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Players — a mixed-age New Zealand family** (confirmed). Grandparents through
cousins, spread across households, who each guess the arrival details of a baby
due **15 August 2026**. They arrive from a single link, self-register with a name
and a four-digit PIN, and have no account, email address, or app to install. Most
will use the product a handful of times: once to guess, once or twice to look at
the board, once when the result lands.

**The host — the person who runs `/admin`** (confirmed: the project owner, and
**not** one of the baby's parents). They register the sweepstake, reset forgotten
PINs, close entries, release name guesses, enter the birth result in stages, and
award close-enough credit on name guesses by hand. Because the host is not a
parent, seeing every name guess on release carries no spoiler cost to them — the
README's warning about handing the admin key to somebody else does not apply
here.

Repo evidence, not separately confirmed by the user: the codebase is built
phone-first for one-handed use on poor reception (`README.md` "Racing the actual
baby"; reflow to 320px with no horizontal scroll). Treat phone-first as the
working assumption until contradicted.

## Product Purpose

A private family guessing game for a single birth. Everyone guesses the **date,
time, weight, length, sex, and first name**; nobody sees anyone else's guesses
until they have locked in their own. When the baby arrives the host enters the
real values and the app scores and ranks everyone.

Success is that the whole family — including the members least comfortable with
technology — gets a guess in before the baby arrives, nobody's guess leaks early,
and the reveal lands as a shared moment rather than an admin chore.

## Positioning

The commit-to-see rule is enforced **server-side by omission**, not by hiding
data in the UI. Before a player commits, other people's guesses are never sent to
the browser; `firstName` is an *optional* property that is **absent** from the
payload before the host releases names, not null or blank, so there is no field
to accidentally render or serialise. The pre-commit teaser draws invented
placeholder shapes rather than blurring real data. `GET /api/board` exists so the
rule can be verified against raw JSON rather than the rendered page.

Two further commitments a neighbouring product could not casually copy:

- **Scoring lands in two waves**, because families usually announce a name days
  after the birth. Five categories score at the arrival; the name scores whenever
  it is revealed. The result form accepts partial answers for the same reason.
- **Names are never fuzzy-matched.** An algorithm would rule on *Isabelle* vs
  *Isabella* with total confidence and annoy somebody either way. Exact matches
  score automatically; the host awards close-enough credit by hand.

## Operating Context

**This is live, under real time pressure.** The guessing window opens **7 August
2026** — today — and closes **29 August 2026**, against a due date of **15 August
2026**. Real relatives are to be sent the link within days.

The end of the window is a real birth, not a scheduled event. The host may be
operating the admin surface tired, one-handed, at an unpredictable hour, possibly
on bad reception. Accordingly:

- "Close entries" is one enormous button at the top of `/admin` with no
  confirmation chain.
- Entries close **server-side**, so a save from a page loaded moments earlier is
  rejected with a clear message rather than silently lost.
- Announcing the birth closes entries automatically, because nobody remembers
  admin panels during labour.
- Latecomers are turned away at registration, not after picking an avatar.

The app sits idle for weeks waiting for a baby, then is used heavily over a few
days. Production uses **Cloud Firestore** through Firebase App Hosting, keeping
the dynamic Next.js application and its data in one Firebase project.

## Capabilities and Constraints

**Confirmed functionality**

- Six guess categories: date, time, weight, length, sex, first name.
- Four visibility stages, enforced in `src/lib/board-access.ts`: not signed in
  (nothing, 401) → signed in but not committed (only "*n* of *m* have locked in")
  → committed (everyone's date, time, weight, length, sex — **not** names) → host
  releases names (plus name guesses) → host enters the result (plus scores and
  the leaderboard).
- Scoring: Date 30 (−5/day), Weight 25 (−1/50 g), Name 20 (exact only), Time 15
  (−1/30 min), Sex 10 (exact), Length 10 (−1/5 mm). Ties share a rank, and every
  category names its own closest guess so more people get a moment.
- Self-registration; no roster is needed up front.
- The app never touches money. It only tallies who has paid. Buy-in defaults to
  **NZD $10**, changeable in `/admin`.

**Authentication constraints**

Four-digit PINs are only 10,000 combinations, so the lockout does the real work:
five wrong attempts park that name for 15 minutes, and obvious PINs (`1234`,
`0000`…) are refused. With no email there is **no self-service recovery** — the
host resets a forgotten PIN from `/admin`, which clears the lockout immediately.

**Technical constraints**

- Next.js 16 + React 19, Cloud Firestore, Tailwind v4, `jose` sessions, argon2 PIN
  hashing. Locale is `en-NZ`.
- This Next.js version has breaking changes from common training data; consult
  `node_modules/next/dist/docs/` before writing framework code (see `AGENTS.md`).
- Local development uses the Firebase Firestore emulator. Production uses
  Application Default Credentials supplied by Firebase App Hosting, so no
  database password or service-account file is committed.
- The baby illustration is one parameterised SVG (`src/components/baby/`) driving
  every toy, under two rules: **the head never changes size** (weight goes to
  torso, cheeks, limbs; length to torso and legs — an inflating head reads as a
  medical diagram, not a chubby baby), and **the drawing stops exaggerating
  before the numbers do** (the slider reports 6 kg but the illustration travels
  only ~80% of its visual range, so the extremes stay charming).

**Open decisions — do not invent answers**

- **Ready for Firebase deployment.** Firestore and an App Hosting backend still
  need to be created in the Firebase console. Given the window opens today,
  this is the live blocker.
- **Whether any players are overseas.** Not confirmed. It affects date, time, and
  currency handling; assume a single NZ timezone only until answered.
- **Buy-in amount** beyond the NZD $10 default.

## Brand Commitments

- Name: **Guess the Lewbner Baby**.
- Voice, as established in existing product copy: plain, warm, and unsentimental.
  It explains a rule in one sentence and trusts the reader ("Guess the day, the
  weight and the name. No peeking until you've locked in."). It does not use
  nursery cuteness, exclamation marks, or coy euphemism for the birth.
- The baby illustration is the product's signature object and its two drawing
  rules above are binding.
- No external brand, sponsor, or client identity applies. This is a private
  family artefact.

## Evidence on Hand

- Working, documented implementation across all six guess panels, the board, the
  results view, and the admin surface (`src/`).
- Unit tests for scoring, units, and calendar maths (`src/lib/*.test.ts`).
- Demo seed data: 8 fictional relatives plus a deliberately uncommitted "Test
  Visitor" for inspecting the locked board (`npm run db:reset`).
- `npx tsx scripts/preview-baby.tsx out.html` renders the illustration across the
  full range of both sliders for visual tuning.
- `GET /api/board` as a verification surface for the visibility rules.

**Absent — must not be fabricated:** no real player roster, no real photographs
or family names, no production URL, no testimonials, no usage data, no pricing or
licensing. The seeded relatives are demo fixtures, not real people.

## Product Principles

1. **Secrecy is a server guarantee, not a UI effect.** Anything a player must not
   see is left out of the payload. Verify against raw JSON; verifying through the
   rendered page proves nothing.
2. **The host is tired and the baby does not wait.** Every admin action must
   survive being done one-handed, at 3am, on bad reception, with no confirmation
   chains to navigate.
3. **Nobody is excluded by their hands, eyes, or confidence.** Every value is
   reachable without dragging; every picture has a list view that is a genuine
   peer, not a fallback.
4. **Refuse to arbitrate what should be human.** Where a judgement would be
   contentious — close-enough names above all — the app defers to the host rather
   than ruling with false confidence.
5. **Charm is a functional requirement.** This is a family game, not a form. The
   illustration and toys carry the occasion, and they stop short of the point
   where they would read as instrumentation.

## Accessibility & Inclusion

Targets **WCAG 2.2 AA**. `axe-core` reports zero violations on every route, in
both locked and unlocked board states. Established, binding requirements:

- Every slider toy is a real `<input type="range">` paired with a numeric field,
  so no value requires dragging to hit. The range thumb is deliberately 32px —
  well past the 24px minimum target — for users with a tremor on a phone.
- Values are announced via `aria-valuetext`; running commentary is separately
  debounced into a live region so dragging does not produce a stream of
  interruptions.
- Each board panel offers a **list view** as a genuine peer of the picture — it
  serves screen readers and low vision, and is the better view on a small phone.
  Only one of the two is ever in the accessibility tree.
- Board avatars are real buttons rendered in *value* order (chronological or
  ascending) so tab order reads sensibly whatever the pixels do. Decorative parts
  (artwork, axis ticks, grid numbers) are `aria-hidden`; interactive parts are
  not.
- Colour is never the only signal. Every foreground/background pair clears 4.5:1
  for text and 3:1 for meaningful non-text, in both light and dark themes.
- Reflows to 320px with no horizontal scroll. Pinch-zoom is never blocked.
- Under `prefers-reduced-motion` the baby still morphs — that is content — but
  the flourishes stop.
