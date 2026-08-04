"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ConversationListItem {
  id: string;
  otherUser: { username: string; avatarUrl: string | null };
  lastMessage: string;
  lastMessageAt: Date;
  isUnread: boolean;
}

export function ConversationList({ conversations }: { conversations: ConversationListItem[] }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/messages/${c.id}`}
          className={cn(
            "flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors",
            pathname === `/messages/${c.id}` && "bg-muted"
          )}
        >
          <Avatar src={c.otherUser.avatarUrl} alt={c.otherUser.username} fallback={c.otherUser.username} size={40} />
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm truncate", c.isUnread ? "font-semibold" : "font-medium")}>
              {c.otherUser.username}
            </p>
            <p className={cn("text-xs truncate", c.isUnread ? "text-foreground" : "text-muted-foreground")}>
              {c.lastMessage}
            </p>
          </div>
          {c.isUnread && (
            <span className="shrink-0 rounded-full bg-primary" style={{ width: "8px", height: "8px" }} />
          )}
        </Link>
      ))}
      {conversations.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">Henüz mesajın yok.</p>
      )}
    </div>
  );
}
