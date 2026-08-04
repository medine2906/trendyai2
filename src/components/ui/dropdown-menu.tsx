"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const DropdownContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children }: { children: ReactNode }) {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("DropdownMenuTrigger, DropdownMenu içinde kullanılmalı");
  return (
    <span onClick={() => ctx.setOpen(!ctx.open)} className="inline-flex cursor-pointer">
      {children}
    </span>
  );
}

export function DropdownMenuContent({
  children,
  align = "start",
  side = "bottom",
  className,
}: {
  children: ReactNode;
  align?: "start" | "end";
  side?: "bottom" | "right" | "top";
  className?: string;
}) {
  const ctx = useContext(DropdownContext);
  const ref = useRef<HTMLDivElement>(null);
  if (!ctx) throw new Error("DropdownMenuContent, DropdownMenu içinde kullanılmalı");

  useEffect(() => {
    if (!ctx.open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        ctx?.setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ctx]);

  if (!ctx.open) return null;

  const sideClasses: Record<string, string> = {
    bottom: "top-full mt-2",
    right: "left-full top-0 ml-2",
    top: "bottom-full mb-2",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[12rem] rounded-none border border-border bg-card p-1 text-card-foreground shadow-lg",
        sideClasses[side],
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ctx = useContext(DropdownContext);
  return (
    <button
      onClick={() => {
        onClick?.();
        ctx?.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{children}</div>;
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
