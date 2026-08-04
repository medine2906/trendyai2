"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { toggleFollow } from "@/lib/actions";

export interface Suggestion {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div className="flex flex-col gap-4">
      {suggestions.map((s) => (
        <SuggestionRow key={s.id} suggestion={s} />
      ))}
    </div>
  );
}

function SuggestionRow({ suggestion }: { suggestion: Suggestion }) {
  const [following, setFollowing] = useState(false);
  const [, startTransition] = useTransition();

  function handleFollow() {
    setFollowing((v) => !v);
    startTransition(() => {
      toggleFollow(suggestion.id);
    });
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <Link href={`/profile/${suggestion.username}`} className="flex items-center gap-2 min-w-0">
        <Avatar src={suggestion.avatarUrl} alt={suggestion.username} fallback={suggestion.username} size={32} />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{suggestion.username}</p>
          <p className="text-xs text-muted-foreground truncate">Sizin için öneriliyor</p>
        </div>
      </Link>
      <button
        onClick={handleFollow}
        className="text-xs font-semibold text-primary hover:text-primary/80 shrink-0"
      >
        {following ? "Takip Ediliyor" : "Takip Et"}
      </button>
    </div>
  );
}
