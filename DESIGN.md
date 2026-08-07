---
name: Guess the Lewbner Baby
description: A family sweepstake explained in marker — cream stock, three highlighters, and not one rounded rectangle.
colors:
  ink: "#111111"
  ink-soft: "#5a5044"
  paper: "#fff8ec"
  paper-raised: "#fffdf7"
  paper-sunk: "#f4ead6"
  track: "#ddd0b8"
  hl-yellow: "#ffe34d"
  hl-pink: "#ff6bae"
  hl-teal: "#00c7b7"
  ink-pink: "#b3005e"
  ink-teal: "#00786e"
  primary: "#ffe34d"
  primary-ink: "#111111"
  primary-soft: "#fff3bc"
  danger: "#c0143c"
  focus: "#0a5cd6"
typography:
  display:
    fontFamily: "Arial, \"Helvetica Neue\", Helvetica, sans-serif"
    fontSize: "2.9rem"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "0.015em"
  headline:
    fontFamily: "Arial, \"Helvetica Neue\", Helvetica, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "0.015em"
  title:
    fontFamily: "Arial, \"Helvetica Neue\", Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "0.015em"
  readout:
    fontFamily: "Arial, \"Helvetica Neue\", Helvetica, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.015em"
  body:
    fontFamily: "Arial, \"Helvetica Neue\", Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Arial, \"Helvetica Neue\", Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "0.015em"
rounded:
  wobble-a: "20px 7px 18px 9px / 9px 18px 7px 20px"
  wobble-b: "8px 20px 9px 17px / 18px 8px 20px 8px"
  wobble-c: "17px 10px 22px 7px / 7px 20px 9px 19px"
  wobble-d: "9px 18px 7px 21px / 20px 9px 17px 8px"
  tick: "10px 5px 9px 4px / 4px 9px 5px 10px"
  tick-b: "5px 10px 4px 9px / 9px 4px 10px 5px"
  rule: "40px 8px 40px 10px / 10px 40px 8px 40px"
  bead: "72% 34% 60% 42% / 38% 66% 40% 62%"
  focus: "6px"
spacing:
  hair: "4px"
  tight: "8px"
  base: "12px"
  box: "16px"
  section: "20px"
  stack: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label}"
    padding: "0 24px"
    height: "54px"
  button-primary-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    height: "54px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "46px"
  box-drawn:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
  plate:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    padding: "0 16px"
    height: "58px"
  input-pin:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    padding: "0 16px"
    height: "64px"
  highlight-swipe:
    textColor: "{colors.ink}"
    padding: "0.02em 0.16em 0.06em"
  panel-row:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
    height: "78px"
  panel-row-next:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    padding: "16px"
    height: "104px"
  slider-thumb:
    backgroundColor: "{colors.hl-yellow}"
    rounded: "{rounded.bead}"
    size: "34px"
---

# Design System: Guess the Lewbner Baby

## Overview

**Creative North Star: "The Marker Zine"**

The whole product is one object: a photocopied zine somebody drew by hand to explain the rules of a family sweepstake. Cream stock, a heavy black chisel-tip marker, and three highlighters. The rules of the game *are* the design — the mechanic is drawn before it is described, and the drawing is the explanation. This exists to refuse the soft neutral card stack every baby-shower app ships: no elevation, no 12px radius, no pastel gradient, no emoji standing in for an icon set.

The app uses one gentle cream-paper rendition in every system colour-scheme preference. The warm canvas keeps the page calm and readable while black ink and the three highlighters retain the zine character.

The density is a zine's: tight, one column, everything on one sheet. Nothing is behind a disclosure. The only geometry allowed to be perfect is the data — a plotted board position is exact; the box drawn around it is not. Every line in the interface, including the box borders, the dividers, the ring around a number and the shadow under a figure, is a stroked path with tremor along its length. A straight line is the tell that a machine drew it.

**Key Characteristics:**
- Every container is a wobbled hand-drawn box (`border-image`), never a rounded rectangle
- Ink plus exactly three highlighters — yellow, pink, teal — and nothing else
- One clean sans-serif family: Arial with Helvetica fallbacks
- Zero shadows; depth is paper stock layered on paper stock
- Illustrations are generated from a seeded PRNG, so no circle is a true circle
- Gentle cream stock is consistent across devices and colour-scheme preferences

## Colors

Black ink on cream stock, with three highlighter inks doing every job colour is allowed to do. The palette is small on purpose and it is a *law*, not a suggestion: the eight avatar accents are four inks crossed with two pencil treatments rather than eight hues, precisely so nobody has to invent a ninth colour to tell two people apart.

### Primary

- **Highlighter Yellow** (`#ffe34d`): The action colour. It fills the primary button, the ticked tally box, the slider bead, and the emphasis ring on the step you are on. It is a *fill* — it never sets type. It is identical in both renditions, because a highlighter survives a photocopier.

### Secondary

- **Highlighter Pink** (`#ff6bae`): The colour that marks a rule. It rings the countdown numeral and swipes the sentence that states the sealed-board mechanic. Used on emphasis inside prose, not on controls.
- **Highlighter Teal** (`#00c7b7`): The colour that closes a section. It draws the masthead underline and the ruled marks under headings.

### Tertiary

- **Ink Pink** (`#b3005e` light / `#ff8fc2` dark) and **Ink Teal** (`#00786e` light / `#35e0cf` dark): the ink-weight versions of two of the highlighters, existing for exactly one reason — when a highlighter *hue* has to carry lettering rather than sit behind it. Yellow deliberately has no ink weight, so yellow can never set type.
- **Danger Red** (`#c0143c` light / `#ff8095` dark): error lettering only, always inside a drawn box and always paired with words. Never a fill.
- **Focus Blue** (`#0a5cd6` light / `#7fb4ff` dark): the focus ring, and the one colour in the system that is not part of the world. That is intentional — the focus ring's job is to be unmistakably not-the-drawing.

### Neutral

- **Cream Stock** (`#fff8ec`): the page. Also the plate colour in *both* renditions. Never `#ffffff` — a full-width sheet of pure white is a torch in the hand at night, and a photocopy is never brighter than the stock it was printed on.
- **Raised Stock** (`#fffdf7`): the interior of a drawn box and the inside of a field. A half-step above the page, so a box reads as a second sheet laid on the first.
- **Sunk Stock** (`#f4ead6`): recessed wells.
- **Marker Black** (`#111111`) and **Soft Ink** (`#5a5044`): body lettering and secondary lettering. In the photocopied rendition these become `#f7f1e4` and `#b9ae9a`.
- **Track** (`#ddd0b8`): drawn furniture — the ruled bar a slider runs along. Not chrome, not a border colour.

### Named Rules

**The Three Pens Rule.** Ink plus exactly three highlighters. A new colour is never a new token: it is one of the three, or it is a pencil *treatment* laid on one of the three. The eight avatar discs are four inks × two treatments (plain and hatched) for this reason, and `resolveAccent()` folds every legacy hue in the database back into the law so no stored value can render a colour the law forbids.

**The Fill-Never-Text Rule.** Highlighters are fills. When a highlighter hue must carry lettering it swaps to its ink weight (`ink-pink`, `ink-teal`). Yellow has no ink weight and therefore never sets type.

**The Black Lettering Rule.** Anything sitting on a highlighter swipe, a filled button, or a plate letters in `#111111` in *both* renditions. Swipes and plates do not invert — that is what makes one drawing serve two renditions. Black on all three highlighter inks clears 4.5:1.

**The Never-Only-Colour Rule.** Colour is never the sole carrier of meaning. A shaded avatar disc is distinguished by its pencil hatch as well as its hue, and every avatar sits beside its owner's name.

## Typography

**Display and Body Font:** Arial, with Helvetica Neue and Helvetica fallbacks.

**Character:** One direct, familiar sans-serif voice. Bold weights distinguish display, labels and readouts; regular weight keeps body copy quiet and highly legible.

### Hierarchy

- **Display** (400, `2.9rem` → `4.2rem` at ≥640px, line-height 0.94, uppercase): the masthead. One per page, and only on the landing page.
- **Headline** (400, `1.875rem`, line-height 1.08, uppercase): the page's own name — the participant's name on the hub, a section head.
- **Title** (400, `1.5rem`, line-height 1.08, uppercase): panel titles, form question labels, the numbers in the tally sentence.
- **Readout** (400, `1.9rem` → `2.25rem` at ≥640px, uppercase, tabular-nums): the live value on a toy — the weight, the length, the time. Dual-unit readouts stack below 420px and drop the separator entirely rather than wrapping it.
- **Body** (450, `1rem`, line-height 1.5): everything that is read. `1.125rem` is the lead size for a sentence that carries the mechanic. Text sits inside a ~32rem column, so line length caps around 65ch without a `max-ch` rule.
- **Label** (400, `1.25rem`, uppercase): button faces, unit suffixes, step numerals.

### Named Rules

**The Weight Rule.** Bold sans-serif letters what is *shown* — mastheads, step numbers, readouts, button faces and panel titles. Regular sans-serif carries what is *read*.

**The Caps Rule.** Display headings remain uppercase (`.marker-caps`) to preserve the zine's emphatic hierarchy. `.marker` supports mixed-case display phrases.

**The Balanced Break Rule.** Every marker class carries `text-wrap: balance`. Hand lettering that ends a line with one orphaned word looks like a mistake, not a choice.

## Layout

One phone column, centred, at every viewport. `max-w-lg` (32rem) with a 20px page gutter (`px-5`), a 24–32px top pad and a 56px bottom pad so the last control clears a browser chrome bar. Desktop does not gain a second column, a sidebar, or a wider measure — it centres the same column, and the wide gutters stay empty. That is an honest known-open, not a resolved decision.

The vertical rhythm is a 4px base scale used at five steps: 4px between the tightest paired elements, 8px between sibling controls, 12px as the default stack gap inside a group, 20px between page sections on the landing page, and 28px between page sections on the hub. Inside a drawn box, padding is 16px horizontal against 12–20px vertical — asymmetric, because the `border-image` already contributes 11px of drawn line on every side.

Two composition patterns recur. A **strip** is a CSS grid with fixed arrow gutters (`1fr auto 1fr auto 1fr`), used for the three-step explainer; a grid rather than a flex row specifically so the panels are the same width at every viewport instead of sizing to their captions. A **stack** is a `flex-col` list of drawn boxes cycling the four drawings, used for the six-panel hub and the board.

Touch targets are generous by policy: 54–64px on primary buttons, 46px on quiet ones, 46px on avatar and colour swatches, and a 34px slider thumb on a 40px track. Nothing is a 24px minimum-compliant target when it can be a 44px comfortable one — the audience includes grandparents on phones.

### Named Rules

**The Phone Column Rule.** One column, 32rem maximum, at 20px gutters, on every viewport. If a layout needs a second column, it needs a rethink instead.

**The 320 Rule.** Every page reflows to 320px with no horizontal overflow. Anything that cannot — a dual-unit readout, a wide strip — stacks or drops a separator rather than scrolling.

**The Zoom Rule.** `maximumScale: 5`. Pinch-zoom is never blocked; it is how a lot of people read a phone.

## Elevation & Depth

**There are no shadows in this system.** Not one `box-shadow` exists in the stylesheet, and none should be added. Depth is paper: the page is cream stock, a drawn box is a slightly lighter sheet laid on it, and a plate is a block of stock pasted on top of that. Three levels, all of them physical, none of them lit.

Where a drawing genuinely needs a figure to sit on a surface, the shadow is *drawn* — three or four overlapping scribbled strokes from `scribbleShadow()` inside the SVG, at the same weight as the outline. A soft ellipse would be a CSS effect on a page that has committed to being drawn.

Texture does the work light usually does. A fixed-position fractal-noise grain sits over the whole viewport at 0.16 opacity (0.11 on the photocopied rendition), generated as an SVG filter rather than shipped as an image so it costs nothing and stays crisp at any density. It is fixed rather than scrolling: paper does not move under the ink. A plate carries its own copy of the same grain at 0.17 in both renditions, because a plate is stock too.

### Named Rules

**The No-Shadow Rule.** No `box-shadow`, no `filter: drop-shadow`, no blurred depth of any kind. If something needs to read as raised, give it a plate.

**The Drawn-Shadow Rule.** A shadow inside an illustration is scribbled strokes, never a blur and never a fill.

## Shapes

There is exactly one container in this design: a rectangle drawn by hand.

Corner-radius tricks were tried and rejected — they bend the corners but leave four perfectly straight edges, which still reads as a rounded rectangle. What makes a line look drawn is tremor along its whole length, so every box border is a real stroked SVG path used as `border-image`: an 11px border, `border-image-slice: 26`, corners 9-slice fixed so they keep the overshoot a real pen leaves past a turn, edges stretched so there is one continuous unrepeated wobble at any box size.

Four separate drawings exist (`a`, `b`, `c`, `d`), plus two black-ink variants (`ink-a`, `ink-b`) that stay black in both renditions for anything filled with a highlighter colour. `border-image` cannot read `currentColor`, so the ink is baked into each data URI and the set is swapped wholesale on the photocopied rendition.

The radii in `rounded` are the exception, and their scope is narrow: small controls, where an 11px drawn border would swamp a 44px target. They come in three groups, and there are no values outside them — a one-off literal radius in a component is a defect, not a variant.

- **`wobble-a` … `wobble-d`** — 44px-and-up controls: avatar and colour swatch cells, the skip link. Four *different* asymmetric radii so adjacent controls never rhyme.
- **`tick` / `tick-b`** — the 28–44px marks: tally squares, done ticks, calendar days, the paid box. Two, alternated down a row so neighbours never rhyme.
- **`rule`** — a ruled line: the slider track and the board's value axes.

The slider thumb uses `bead`, an uneven percentage blob rotated -6°, so the grip reads as drawn at the one size it is ever seen.

Inside artwork, geometry comes from `src/components/zine/rough.ts` — a seeded mulberry32 PRNG feeding `roughCircle`, `roughEllipse`, `roughRect`, `roughRoundRect`, `roughRing`, `hatchCircle`, `hatchRect` and `scribbleShadow`. Everything is deterministic from a seed string so server and client render identical paths and React never sees a hydration mismatch. Hatching is computed analytically against the shape (a Liang–Barsky clip for rectangles, a chord solve for circles) rather than with a `<clipPath>`, because these drawings render in Server Components where `useId` is unavailable and any generated clip-path id would either collide across instances or force the whole illustration client-side.

Where the build and this rule diverge, honestly: the outlines, discs, faces, ears, neck, rings and boxes are all rough-drawn, and volume everywhere now comes from hatching — the flat `#000 @ 0.22` shoulder wash was the last fill-for-volume in the set and has been replaced by `hatchRect`. What remains as true `<circle>` / `<ellipse>` / `<rect rx>` primitives are the **hair silhouettes and accessories** inside `Avatar.tsx` (`buzz`, `afro`, `bun`, `ponytail`, `braids`, the glasses lenses) and one detail in `Icon.tsx`. Those are a carried defect, not a permission: they are outlined by their parent group so they read as drawn at avatar sizes, but a future pass should generate them like everything else.

### Named Rules

**The Drawn Box Rule.** Every container is a `border-image` drawn box. There is deliberately no `rounded-card` utility in the theme and none may be added — leaving a card radius in the theme only invites the rounded rectangles this world exists to refuse.

**The Intrinsic Size Rule.** Every `border-image` SVG data URI carries explicit `width` and `height` attributes, not just a `viewBox`. Without an intrinsic size the browser measures `border-image-slice` against the default 300×150 object size and the corners tear off the edges. This was found by failing first.

**The Four Drawings Rule.** Cycle `a` → `b` → `c` → `d` down any stack of boxes so no two adjacent containers are the same rectangle traced twice.

**The Stable Seed Rule.** A drawing's seed excludes the values that morph it. Reseeding per slider tick makes the figure "boil" while you drag, which fights the one thing the drawing exists to show. The hand stays still; only the body changes.

## Components

### Buttons

- **Shape:** a filled drawn box — `border-image` in permanent black ink (`ink-a`), with `background-clip: border-box`. The fill runs out *under* the drawn stroke rather than stopping neatly at it, so the colour reads as having been laid down past the line, which is what colouring something in actually looks like. A fill that stops exactly at the border is a UI button wearing a costume.
- **Primary:** yellow fill, black marker lettering at label size, 54–58px minimum height, 24px horizontal padding, usually paired with a drawn icon at 26px. One per screen.
- **Disabled:** the box goes *uncoloured* — transparent fill, soft-ink lettering, and it swaps to the plain `b` drawing. Not the same box at reduced opacity: fading the fill dragged the yellow toward olive on the photocopied rendition and made the page's only call to action look broken rather than waiting.
- **Quiet:** no box at all. Body-size text with a 2px underline at 4px offset, 46px minimum height. Used for "Back" and "that's not me".
- **Focus:** a 3px `focus`-blue outline at 3px offset with a 6px radius, applied uniformly to every focusable element in the app from one `:focus-visible` rule.

### Inputs / Fields

- **Style:** a drawn box you write inside, which is what a form on paper is. The `b` drawing for inputs, the `d` drawing for textareas, raised-stock interior, 58px minimum height, 16px horizontal padding. The PIN field is 64px at display size with `0.45em` tracking.
- **Placeholder:** soft ink at full opacity — never a faded version of the real value.
- **Native date and time:** the control stays native (its picker is better than anything worth hand-rolling), but its chrome is brought into the hand. The value is lettered in Marker at `1.35rem`, the OS picker glyph is replaced with the world's own drawn calendar mark, and an unfilled `dd/mm/yyyy` mask renders in soft ink so it reads as help text rather than as a value.
- **Error:** a drawn `b` box with danger-red semibold body lettering, in an assertive live region. Errors are always words, never a red border alone.

### Sliders

The primary control on four of six toys, so it is deliberately oversized: a 34px ink bead on a 14px ruled track inside a 40px hit area, well past any minimum target size — somebody with a tremor should be able to use this on a phone. The thumb is a yellow bead with a 2.5px ink outline; the track is the drawn-furniture colour with a 2px ink line. Every slider is paired with a typed numeric field, because dragging to hit exactly 3.6 kg is a fiddly motor task and typing it is not.

### Cards / Containers

- **Shape:** `border-image` drawn box, one of four drawings, no radius.
- **Background:** raised stock, `background-clip: padding-box` so the fill stops inside the drawn line (the inverse of the filled button, and the difference between a box you look into and a box someone coloured in).
- **Padding:** 16px horizontal, 12–20px vertical.
- **Shadow:** none, ever. See Elevation & Depth.

### Highlighter Swipe

A run of words with a marker swipe under them. Painted as the element's **own `background-image`** with `background-size: 100% 100%` and `box-decoration-break: clone` — never as an absolutely positioned pseudo-element. That is load-bearing, not a preference: a swipe marks a run of words mid-sentence, and when that run wraps an absolute box is sized from the first fragment only, which left the landing page's thesis sentence with a stray pink sliver. A cloned background is painted onto every fragment, so the swipe survives any wrap at any width.

Each swipe is one pass of a chisel tip: heavy in the middle, dry at both ends, with the drag marks the nib leaves along the way, and the colour baked opaque into the SVG so the lettering on top never depends on a blend mode.

### The Plate

The signature container. A block of paper stock an illustration is printed on and pasted into the page — cream stock and black lettering in **both** renditions, carrying the black-ink drawn border and its own grain. This is what lets the artwork stay one drawing: a black line on a photocopied-black page is no line at all, and zines solve it the same way, by giving the picture its own white block, rather than by maintaining a second negative version of every illustration.

### Drawn Marks

`Underline`, `Arrow` and `Burst` are the marks a hand makes *around* content — the swipe under a heading, the arrow pointing at what matters, the scribbled ping beside an active control. All decorative, all `aria-hidden`, and none is ever the only carrier of meaning: if a burst marks a selected option, the option also says so in words.

### Icons

One drawn set (`src/components/zine/Icon.tsx`), 24×24 viewBox, `currentColor`, 2.1 stroke weight, round caps and joins, paths that don't quite close square — the same pen that draws the boxes. Decorative by default with `title` opting into an accessible name; everywhere an icon appears it sits beside a real text label. The set replaced emoji, which meant the icon "system" was really twelve illustrators at twelve weights rendered differently on every device the family owns. Known-open: the set is uniform line art rather than filled or hatched objects, so it reads lighter than the boxes around it.

### Avatars

A flat portrait built from primitives on a drawn accent disc, with hair split into a layer behind the head and a layer in front so an afro sits *around* a face while a fringe sits *on* it. Outlines are a fixed `#111111` rather than a themed variable, because an avatar always sits on its own saturated disc which does not change between renditions. Seeded on the character rather than the instance, so one person's face is the same drawing everywhere it appears.

**The Plot-Size Rule.** Below 40px, hatch shading switches to a few deliberately bold strokes (3.2 weight, 9.5 gap) instead of the fine pencil hatch (1.1 weight, 4.6 gap). The board packs avatars at ~32px, and a fine hatch simply vanished there, leaving five indistinguishable pink discs on one axis. At a glance a small shaded disc has to read as *striped* — that is the whole job.

### The Baby

The signature illustration, shared by every toy so the guessing flow feels like one world rather than six unrelated widgets. Morphs directly off props with no animation library — React re-rendering as the slider moves *is* the animation, which is also why it behaves correctly under reduced motion: the shape change is content, so it should still happen, it just shouldn't spring. Volume comes from pencil hatching and every outline is drawn in two passes at different weights (2.5 and 1.5), never one even line.

### Motion

One authored moment: `ink-in`, 620ms on a `cubic-bezier(0.16, 1, 0.3, 1)`, fading a thing in from 10px down with a -0.6° rotation and a 3px blur clearing. A `draw-on` stroke-dashoffset animation exists for a line that draws itself. Under `prefers-reduced-motion` both stop and all transitions collapse to 0.01ms — but the baby still morphs, because that is content.

**The One Arrival Rule.** `ink-in` is used only where something genuinely appears for the first time — the board reveal, a guess detail opening, the results. Never on navigation, and never on six things at once with the same timing. Known-open: this single entrance is currently the system's entire motion vocabulary.

## Do's and Don'ts

### Do:

- **Do** draw every container as a `border-image` box, cycling the four drawings (`a` → `b` → `c` → `d`) down a stack.
- **Do** give every `border-image` SVG data URI explicit `width` and `height` attributes, or `border-image-slice` will measure against 300×150 and tear the corners off.
- **Do** paint a highlighter swipe as the element's own `background-image` with `box-decoration-break: clone`, so it survives a wrap mid-sentence.
- **Do** put black-line artwork on a `plate` — cream stock in both renditions — so one drawing serves the cream page and the photocopy.
- **Do** letter in `#111111` on any highlighter fill, swipe, or plate, in both renditions.
- **Do** use `rough.ts` for illustration geometry, seeded on the identity of the thing drawn and never on the value that morphs it.
- **Do** size touch targets at 46px minimum and primary actions at 54px+, and keep the slider thumb at 34px.
- **Do** pair every slider with a typed numeric field.
- **Do** give an icon a text label beside it, and mark it `aria-hidden` unless it carries meaning alone.
- **Do** switch avatar hatching to bold strokes below 40px so shaded and plain discs stay distinguishable at plot size.

### Don't:

- **Don't** add a `rounded-card` utility, a card radius token, or any true rounded rectangle to the theme.
- **Don't** add a `box-shadow`, `drop-shadow`, or any blurred depth. Depth is stock on stock.
- **Don't** introduce a fourth accent colour. It is one of the three highlighters, or it is a pencil treatment on one of them.
- **Don't** set type in a highlighter fill colour — use its ink weight, and never set type in yellow at all.
- **Don't** render a disabled primary action as the same filled box at reduced opacity; take the colour out entirely.
- **Don't** position a highlighter swipe as an absolute pseudo-element.
- **Don't** use `Math.random()` in any drawing helper — every path must be deterministic from a seed, or hydration breaks.
- **Don't** use a `<clipPath>` for hatching; the intersection is solved analytically so the artwork stays a Server Component.
- **Don't** ship an emoji or a third-party icon font. The app draws its own pictures.
- **Don't** letter body copy, help text, hints or error messages in Marker.
- **Don't** use `#ffffff` anywhere. Cream stock is the brightest surface in the system.
- **Don't** block pinch-zoom or lower `maximumScale`.
