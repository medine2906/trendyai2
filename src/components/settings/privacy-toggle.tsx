"use client";

import { useState, useTransition } from "react";
import { togglePrivacy } from "@/lib/actions";

export function PrivacyToggle({ isPrivate }: { isPrivate: boolean }) {
  const [checked, setChecked] = useState(isPrivate);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const next = !checked;
    setChecked(next);
    startTransition(() => {
      togglePrivacy(next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        checked ? "bg-primary border-primary" : "bg-muted border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full border border-black/10 bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
