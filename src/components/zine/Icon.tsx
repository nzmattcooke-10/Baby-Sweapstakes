/**
 * The drawn icon set.
 *
 * Every icon in the app comes from here, at one stroke weight, with round caps
 * and joins and paths that don't quite close square — the same pen that draws
 * the boxes. The app previously used emoji for these, which meant the icon
 * "system" was really twelve different illustrators at twelve different
 * weights, rendered differently on every device the family owns.
 *
 * Icons are decorative by default: everywhere one appears it sits beside a
 * real text label. Pass `title` only where an icon carries meaning alone.
 */

export type IconName =
  | "day"
  | "time"
  | "weight"
  | "length"
  | "sex"
  | "name"
  | "tick"
  | "arrow"
  | "sealed"
  | "star"
  | "cheer"
  | "pen";

const PATHS: Record<IconName, React.ReactNode> = {
  /* A torn-off calendar page with one date ringed. */
  day: (
    <>
      <path d="M4.2 6.6 C 8 6.1, 16 6.2, 19.8 6.5 C 20.1 10.5, 20 16.4, 19.6 19.6 C 15 20.1, 8.4 20, 4.4 19.5 C 4 16, 4 10, 4.2 6.6 Z" />
      <path d="M4.4 10.2 C 9 9.8, 15.6 9.9, 19.7 10.1" />
      <path d="M8.4 6.4 L 8.2 3.4" />
      <path d="M15.7 6.4 L 15.9 3.4" />
      <path d="M13.4 13.1 C 11.2 12.4, 9.4 13.6, 9.7 15.3 C 10 17.1, 12.6 17.6, 14 16.4 C 15.4 15.2, 14.8 13.3, 12.6 13" />
    </>
  ),

  /* Sun climbing over a horizon. */
  time: (
    <>
      <path d="M2.6 18.4 C 8 17.9, 16.4 18.1, 21.4 18.3" />
      <path d="M7.1 18.2 C 6.6 14.2, 9 11.3, 12.1 11.3 C 15.2 11.3, 17.5 14.3, 17 18.2" />
      <path d="M12.1 7.9 L 12 5.1" />
      <path d="M5.4 10.6 L 3.6 8.7" />
      <path d="M18.8 10.5 L 20.7 8.6" />
      <path d="M4.6 21.2 C 9.4 20.8, 15.2 20.9, 19.6 21.1" />
    </>
  ),

  /* A balance scale, pans uneven because nobody draws them level. */
  weight: (
    <>
      <path d="M12 4.1 L 11.9 19.6" />
      <path d="M4.4 8.2 C 9 7.1, 15.4 7.3, 19.7 8.4" />
      <path d="M7.6 20.1 C 10.4 19.6, 13.8 19.7, 16.4 20.2" />
      <path d="M4.4 8.3 L 1.9 14.1 C 3.6 15.6, 5.5 15.5, 7 14 Z" />
      <path d="M19.7 8.5 L 22.1 14.3 C 20.3 15.7, 18.4 15.6, 17 14.1 Z" />
      <circle cx="12" cy="5.6" r="1.5" />
    </>
  ),

  /* A ruler with its ticks. */
  length: (
    <>
      <path d="M2.4 8.4 C 8.6 7.9, 16.4 8, 21.6 8.4 C 22 11.2, 21.9 13.6, 21.5 15.7 C 15.6 16.2, 7.8 16.1, 2.5 15.6 C 2.1 13.4, 2.1 10.6, 2.4 8.4 Z" />
      <path d="M6.4 8.6 L 6.4 12.4" />
      <path d="M9.9 8.6 L 9.9 11.1" />
      <path d="M13.4 8.6 L 13.4 12.4" />
      <path d="M17 8.6 L 17 11.1" />
    </>
  ),

  /* Two hats side by side — the bonnet and the cap, which is the actual
     choice the panel offers. */
  sex: (
    <>
      {/* Bonnet upper left, cap lower right. The bonnet's tie was dropped: at
          30px it curled into the cap's peak and the pair read as one blob. Two
          clean domes on a diagonal survive the size. */}
      <path d="M2.4 11 C 2.4 6.4, 4.6 4, 7 4 C 9.4 4, 11.6 6.4, 11.6 11 Z" />
      <path d="M1.4 11.2 C 4.6 10.7, 9.4 10.8, 12.6 11.3" />
      <path d="M12.6 19 C 12.6 14.4, 14.8 12, 17.2 12 C 19.6 12, 21.8 14.4, 21.8 19 Z" />
      <path d="M11.8 19.2 C 15 18.7, 19.6 18.8, 22.6 19.3" />
      <path d="M22.4 19.4 C 23.4 19.7, 23.8 20.5, 23.4 21.2 C 21.6 21.5, 19.6 21.3, 18.2 21" />
    </>
  ),

  /* A sealed envelope: the name guess nobody opens until it's announced. */
  name: (
    <>
      <path d="M2.6 6.6 C 8.6 6.1, 16 6.2, 21.4 6.6 C 21.8 10.6, 21.7 15.4, 21.3 18.4 C 15 18.9, 8.4 18.8, 2.7 18.3 C 2.3 15.2, 2.3 9.8, 2.6 6.6 Z" />
      <path d="M2.9 7.2 C 6.4 10.4, 9.6 12.6, 12 12.6 C 14.4 12.6, 17.6 10.4, 21.1 7.3" />
      <path d="M14.6 15.6 C 15.6 13.9, 18 13.9, 18.9 15.4 C 19.8 16.9, 18.4 18.6, 16.7 18.5 C 15 18.4, 14 17, 14.6 15.6 Z" />
    </>
  ),

  /* The tick a person actually makes: down hard, up fast, overshooting. */
  tick: <path d="M4.1 12.9 C 6.2 14.6, 8 16.6, 9.6 19.2 C 12.6 13.2, 16 8.4, 20.6 4.6" />,

  arrow: (
    <>
      <path d="M3.4 12.2 C 8.8 11.7, 15.4 11.8, 20.4 12.1" />
      <path d="M15.6 6.8 C 17.4 8.9, 19 10.7, 20.6 12.1 C 19 13.6, 17.3 15.4, 15.5 17.6" />
    </>
  ),

  /* A padlock, shackle drawn as one arc that misses the body slightly. */
  sealed: (
    <>
      <path d="M4.3 10.6 C 9 10.1, 15.4 10.2, 19.8 10.6 C 20.2 14.2, 20.1 18, 19.7 20.6 C 15 21.1, 8.8 21, 4.4 20.5 C 4 18, 4 13.6, 4.3 10.6 Z" />
      <path d="M7.4 10.3 C 6.9 6.2, 8.9 3.4, 12.1 3.4 C 15.3 3.4, 17.2 6.2, 16.8 10.3" />
      <path d="M12.1 14.4 L 12 17.1" />
    </>
  ),

  star: (
    <path d="M12.1 3.2 L 14.7 9.2 L 21.1 9.9 L 16.3 14.2 L 17.7 20.6 L 12 17.4 L 6.3 20.7 L 7.6 14.2 L 2.8 10 L 9.3 9.2 Z" />
  ),

  /* Three bursts — the mark you make around something that just happened. */
  cheer: (
    <>
      <path d="M12 3.1 L 12 7.4" />
      <path d="M5.6 5.4 L 8.2 8.8" />
      <path d="M18.5 5.3 L 15.9 8.8" />
      <path d="M3.1 12.4 L 7.4 12.6" />
      <path d="M20.9 12.3 L 16.6 12.6" />
      <path d="M6.4 19.8 C 9 16.4, 15.1 16.3, 17.8 19.6 C 14.2 21.2, 10 21.3, 6.4 19.8 Z" />
    </>
  ),

  pen: (
    <>
      <path d="M3.4 20.6 C 4 17.9, 4.8 16.2, 6.1 15 L 15.6 5.2 C 16.8 4, 18.4 4.1, 19.5 5.3 C 20.6 6.5, 20.6 8.1, 19.4 9.2 L 9.8 18.9 C 8.5 20.1, 6.4 20.6, 3.4 20.6 Z" />
      <path d="M14.2 6.7 L 18.1 10.6" />
    </>
  ),
};

export function Icon({
  name,
  size = 24,
  title,
  className,
  strokeWidth = 2.1,
}: {
  name: IconName;
  size?: number;
  /** Accessible name. Omit to render decoratively (the default). */
  title?: string;
  className?: string;
  strokeWidth?: number;
}) {
  const decorative = !title;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={title}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
