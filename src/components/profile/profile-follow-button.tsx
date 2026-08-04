"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions";

export function ProfileFollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={() => {
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
