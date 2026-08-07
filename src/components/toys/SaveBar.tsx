"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await onSave();
      if (result.ok) {
        router.push("/guess");
        router.refresh();
      } else {
        setError(result.error);
      }
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
        disabled={disabled || pending}
        className="filled marker-caps flex min-h-[58px] w-full max-w-sm items-center justify-center gap-2 px-6 text-xl"
      >
        {pending ? "Saving…" : label}
        {!pending && <Icon name="tick" size={26} strokeWidth={2.6} />}
      </button>

      {disabled && disabledHint && (
        <p className="text-center text-base text-ink-soft">{disabledHint}</p>
      )}
    </div>
  );
}
