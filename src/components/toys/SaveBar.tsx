"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@/app/guess/actions";
import { Icon } from "@/components/zine/Icon";

/**
 * The "lock it in" control shared by every panel.
 *
 * Errors are rendered in an assertive live region: a failure here means a
 * guess was not saved, and somebody who can't see the screen needs to know
 * that immediately rather than on their next tab stop.
 */
export function SaveBar({
  onSave,
  disabled,
  label = "Lock it in",
  disabledHint,
}: {
  onSave: () => Promise<ActionResult>;
  disabled?: boolean;
  label?: string;
  disabledHint?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Holds the button on "Saved!" for a beat after a successful write, so the
  // save visibly lands before the panel closes and returns to the guess hub.
  const [saved, setSaved] = useState(false);

  // Navigate from an effect once the save has landed, rather than from inside
  // the transition. A stray `router.refresh()` next to the push used to re-fetch
  // the panel route and cancel the navigation, stranding the user on the page.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.push("/guess"), 650);
    return () => clearTimeout(timer);
  }, [saved, router]);

  function submit() {
    if (pending || saved) return;
    setError(null);
    startTransition(async () => {
      const result = await onSave();
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="drawn-b w-full max-w-sm px-4 py-3 text-center text-base font-semibold text-danger"
        >
          {error}
        </p>
      ) : (
        <p role="alert" aria-live="assertive" className="sr-only" />
      )}

      <button
        type="button"
        onClick={submit}
        disabled={(disabled && !saved) || pending}
        className="filled marker-caps flex min-h-[58px] w-full max-w-sm items-center justify-center gap-2 px-6 text-xl"
      >
        {saved ? "Saved!" : pending ? "Saving…" : label}
        {(saved || !pending) && <Icon name="tick" size={26} strokeWidth={2.6} />}
      </button>

      {disabled && !saved && disabledHint && (
        <p className="text-center text-base text-ink-soft">{disabledHint}</p>
      )}
    </div>
  );
}
