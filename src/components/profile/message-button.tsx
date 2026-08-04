"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startConversation } from "@/lib/actions";

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => startConversation(targetUserId))}
    >
      Mesaj Gönder
    </Button>
  );
}
