"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Remark } from "@/lib/commentary";
import { scrollFieldIntoView } from "@/lib/scroll-into-view";

/**
 * The shared chassis for every slider-driven toy: illustration on top, real
 * control underneath.
 *
 * Sliders are the single biggest accessibility risk in this design — a custom
 * drag surface excludes anyone with a tremor, low vision, or a screen reader —
 * so all of that is solved once, here, rather than six times with six chances
 * to get it wrong.
 *
 * Three decisions worth knowing about:
 *
 * 1. The value is announced through `aria-valuetext` on the native range input.
 *    That is the mechanism screen readers already understand for a slider, and
 *    it fires at exactly the right moment. Mirroring the value into a live
 *    region as well would make every drag announce twice.
 * 2. The running commentary *is* in a live region, because it's extra
 *    information rather than the control's value — but it's debounced, so
 *    dragging across the range doesn't produce a stream of interruptions.
 * 3. There is always a numeric field. Dragging to hit exactly 3.6 kg is a
 *    fiddly motor task; typing it is not.
 */

type Props = {
  /** e.g. "Weight" — labels both the slider and the numeric field. */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Big visible readout, e.g. "3.40 kg · 7 lb 8 oz". */
  display: string;
  /** Spoken form for assistive tech, e.g. "3.4 kilograms, 7 pounds 8 ounces". */
  spoken: string;
  /** Canonical value → what goes in the numeric box (e.g. grams → "3.4"). */
  toInput: (value: number) => string;
  /** Numeric box → canonical value. Return null for unparseable input. */
  fromInput: (raw: string) => number | null;
  /** Unit suffix shown beside the numeric box, e.g. "kg". */
  inputUnit: string;
  remark?: Remark;
  /** The illustration. Rendered aria-hidden — it reinforces, never informs. */
  children: React.ReactNode;
};

export function ToyShell({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  spoken,
  toInput,
  fromInput,
  inputUnit,
  remark,
  children,
}: Props) {
  const sliderId = useId();
  const numberId = useId();

  // The numeric box keeps its own draft so half-typed values like "3." aren't
  // yanked out from under the person typing them.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? toInput(value);

  const [announced, setAnnounced] = useState(remark?.text ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!remark) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAnnounced(remark.text), 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [remark]);

  function commitDraft() {
    if (draft === null) return;
    const parsed = fromInput(draft);
    if (parsed !== null) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
    setDraft(null);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div aria-hidden="true" className="w-full">
        {children}
      </div>

      {/* The reading, in the hand that wrote the rest of the zine.
          Dual-unit readouts ("3.40 kg · 7 lb 8 oz") don't fit one line on a
          narrow phone, so below 420px they stack and the separator is dropped
          entirely. The dot only exists when both units genuinely share a line:
          a wrap that strands it at the end of line one, or two units running
          together with nothing between them, both read as bugs. */}
      <p
        className="marker-caps flex max-w-full flex-col items-center justify-center gap-x-3 text-center text-[1.9rem] leading-tight tabular-nums min-[420px]:flex-row min-[420px]:items-baseline sm:text-4xl"
        aria-hidden="true"
      >
        {display.split(" · ").map((part, index) => (
          <span key={part} className="whitespace-nowrap">
            {index > 0 && (
              <span className="mr-3 hidden min-[420px]:inline">·</span>
            )}
            {part}
          </span>
        ))}
      </p>

      {/* A margin note, the way somebody would scribble beside a drawing.
          The emoji these used to carry are gone: this app draws its own
          pictures now, and a system emoji among them looked borrowed. */}
      {remark && (
        <p
          aria-hidden="true"
          className="min-h-[1.5rem] max-w-[26rem] text-center text-lg text-ink-soft italic"
        >
          {remark.text}
        </p>
      )}

      {/* Debounced so dragging across the range doesn't interrupt constantly. */}
      <p aria-live="polite" className="sr-only">
        {announced}
      </p>

      <div className="w-full max-w-md">
        <label htmlFor={sliderId} className="sr-only">
          {label}
        </label>
        <input
          id={sliderId}
          type="range"
          className="toy-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={spoken}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={numberId} className="text-base text-ink-soft">
          Or type it:
        </label>
        <input
          id={numberId}
          type="text"
          inputMode="decimal"
          className="field w-28 px-3 py-2 text-right text-lg tabular-nums"
          value={shown}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={scrollFieldIntoView}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
        />
        {inputUnit && (
          <span className="marker-caps text-xl">{inputUnit}</span>
        )}
      </div>
    </div>
  );
}
