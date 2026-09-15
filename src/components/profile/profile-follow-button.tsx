"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions";
import { useRequireAuth } from "@/lib/use-require-auth";

export function ProfileFollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();
  const { requireAuth } = useRequireAuth();

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={() => {
        if (!requireAuth()) return;
        setFollowing((v) => !v);
        startTransition(() => {
          toggleFollow(targetUserId);
        });
      }}
    >
      {following ? "Takip Ediliyor" : "Takip Et"}
    </Button>
  );
}
