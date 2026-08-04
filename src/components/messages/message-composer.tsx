"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/actions";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [value, setValue] = useState("");
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content) return;
    setValue("");
    startTransition(() => {
      sendMessage(conversationId, content);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-4">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Mesaj yaz..."
        className="flex-1"
      />
      <Button type="submit" size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
