"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions";

/**
 * Family devices get shared — a tablet on the kitchen bench, a phone handed
 * round at a barbecue — so there has to be a way to stop being whoever signed
 * in last.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="min-h-[44px] underline decoration-2 underline-offset-4"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
