import Link from "next/link";
import { Heart, UserPlus, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SuggestionList, type Suggestion } from "@/components/feed/suggestion-card";

export interface RailNotification {
  id: string;
  type: "like" | "comment" | "follow";
  actor: { username: string; avatarUrl: string | null };
  createdAt: Date;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}s`;
  return `${Math.floor(hours / 24)}g`;
}

const NOTIFICATION_TEXT: Record<RailNotification["type"], string> = {
  like: "gönderini beğendi",
  comment: "yorum yaptı",
  follow: "seni takip etti",
};

const NOTIFICATION_ICON: Record<RailNotification["type"], typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

export function HomeRightRail({
  suggestions,
  notifications,
}: {
  suggestions: Suggestion[];
  notifications: RailNotification[];
}) {
  if (suggestions.length === 0 && notifications.length === 0) return null;

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-6 py-6">
      {suggestions.length > 0 && (
        <section className="border border-border bg-card p-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Takip Önerileri
          </h2>
          <SuggestionList suggestions={suggestions} />
        </section>
      )}

      {notifications.length > 0 && (
        <section className="border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Son Bildirimler
            </h2>
            <Link href="/activity" className="text-xs font-medium text-accent hover:underline">
              Tümü
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {notifications.map((n) => {
              const Icon = NOTIFICATION_ICON[n.type];
              return (
                <Link
                  key={n.id}
                  href={n.type === "follow" ? `/profile/${n.actor.username}` : "/activity"}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <Avatar src={n.actor.avatarUrl} alt={n.actor.username} fallback={n.actor.username} size={24} />
                  <p className="min-w-0 flex-1 truncate text-xs">
                    <span className="font-medium">{n.actor.username}</span>{" "}
                    <span className="text-muted-foreground">{NOTIFICATION_TEXT[n.type]}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </aside>
  );
}
