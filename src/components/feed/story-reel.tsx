import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function StoryReel({
  stories,
}: {
  stories: { id: string; username: string; avatarUrl: string | null; imageUrl: string }[];
}) {
  if (stories.length === 0) return null;

  return (
    <div className="flex gap-6 overflow-x-auto px-6 py-4 border-b border-border">
      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/profile/${story.username}`}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <Avatar
            src={story.imageUrl}
            alt={story.username}
            fallback={story.username}
            size={64}
            ringGradient
          />
          <span className="text-xs text-muted-foreground max-w-[64px] truncate">{story.username}</span>
        </Link>
      ))}
    </div>
  );
}
