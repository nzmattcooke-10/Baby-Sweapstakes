"use client";

import { useState, useTransition } from "react";
import { adminSignIn } from "@/app/admin/actions";

export function AdminSignIn() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await adminSignIn(pin);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="drawn-b px-4 py-3 text-center text-base font-semibold text-danger"
        >
          {error}
        </p>
      ) : (
        <p role="alert" aria-live="assertive" className="sr-only" />
      )}
      <label htmlFor="adminPin" className="marker-caps text-2xl">
        Host PIN
      </label>
      <input
        id="adminPin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="field min-h-[64px] px-4 text-center text-4xl tracking-[0.45em]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || pin.length !== 4}
        className="filled marker-caps min-h-[56px] px-6 text-xl"
      >
        {pending ? "Checking…" : "Open host tools"}
      </button>
    </div>
  );
}
