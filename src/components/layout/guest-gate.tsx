import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestGateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function GuestGate({ icon: Icon, title, description }: GuestGateProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-24 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Link
        href="/login"
        className={cn(
          "mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-none bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-85"
        )}
      >
        Giriş Yap
      </Link>
    </div>
  );
}
