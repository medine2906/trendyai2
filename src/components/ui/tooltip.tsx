"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  side = "right",
  children,
}: {
  content: ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const sideClasses: Record<string, string> = {
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  };

  return (
    <span
      className="relative flex w-full"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-none bg-foreground px-2 py-1 text-xs text-background shadow-md",
            sideClasses[side]
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
