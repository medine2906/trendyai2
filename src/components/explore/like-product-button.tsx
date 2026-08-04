"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleProductLike } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LikeProductButton({
  productId,
  likedByMe,
  className,
}: {
  productId: string;
  likedByMe: boolean;
  className?: string;
}) {
  const [liked, setLiked] = useState(likedByMe);
  const [, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLiked((v) => !v);
    startTransition(() => {
      toggleProductLike(productId);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      className={cn("rounded-full", className)}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-destructive text-destructive")} />
      <span className="sr-only">Beğen</span>
    </Button>
  );
}
