"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startConversation } from "@/lib/actions";
import { useRequireAuth } from "@/lib/use-require-auth";

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const { requireAuth } = useRequireAuth();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        if (!requireAuth()) return;
        startTransition(() => startConversation(targetUserId));
      }}
    >
      Mesaj Gönder
    </Button>
  );
}
