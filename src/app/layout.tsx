import type { Metadata, Viewport } from "next";
import "./globals.css";

// Every route reflects live Firestore state. Rendering happens in Firebase App
// Hosting at request time, never during the credential-free build step.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guess the Lewbner Baby",
  description: "Guess the day, the weight and the name. No peeking until you've locked in.",
};

export const viewport: Viewport = {
  themeColor: "#fff8ec",
  // Never block zoom — pinch-zoom is how a lot of people read a phone screen.
  maximumScale: 5,
};

/**
 * The direction contract. Emitted as a real HTML comment so it survives the
 * production build and can be audited against the render:
 *   npm run build && grep -r "seed 25406281" .next/server/app
 */
const CONTRACT = `<!--
IMPECCABLE DIRECTION CONTRACT · seed 25406281 · hand-drawn-zine-explainer

THESIS: The rules of this game are the design. A sweepstake explained in
marker, by hand, the way a relative would sketch it on the back of an
envelope. It refuses the soft neutral card stack every baby-shower app ships.

OWN-WORLD: Gentle cream stock and black ink; three highlighters (yellow, pink,
teal) as the only colour. Every container is a wobbled drawn box, never a
rounded rectangle. Arial and close sans-serif fallbacks keep every label and
paragraph clean and direct.

STORY: You land, understand in one glance that nobody sees your guesses until
you commit, and write your name in. You come back for the reveal.

FIRST VIEWPORT: Marker masthead over a hand-drawn countdown; the sealed-board
rule stated once as a drawn diagram with an arrow; join form below, primary
action a filled yellow marker box.

FORM: Challenger, chosen over the assigned grounded direction (candidate 3,
the clubroom sheet); seed key 25406281.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" className="h-full antialiased">
      <body className="min-h-full">
        <div
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{ __html: CONTRACT }}
        />
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
        {/* Deploy marker: bump this string to confirm a redeploy actually
            landed. It's the quickest way to tell the live build apart from the
            previous one when the visible changes are subtle. */}
        <footer className="pb-6 text-center text-xs text-ink-soft">v2.0</footer>
      </body>
    </html>
  );
}
