"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SheetContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

export function Sheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ children }: { children: ReactNode }) {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("SheetTrigger, Sheet içinde kullanılmalı");
  return (
    <span onClick={() => ctx.setOpen(true)} className="inline-flex cursor-pointer">
      {children}
    </span>
  );
}

export function SheetContent({
  children,
  side = "left",
  className,
}: {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}) {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("SheetContent, Sheet içinde kullanılmalı");
  if (!ctx.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={() => ctx.setOpen(false)} />
      <div
        className={cn(
          "absolute top-0 h-full w-72 max-w-[85vw] bg-card p-6 shadow-xl",
          side === "left" ? "left-0" : "right-0",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
