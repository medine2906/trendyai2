"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MoreHorizontal, Heart, Bookmark, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { toggleLike, toggleSave } from "@/lib/actions";
import { cn, formatTL } from "@/lib/utils";
import { CommentList, type CommentData } from "@/components/feed/comment-list";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";

export interface PostCardData {
  id: string;
  imageUrl: string;
  caption: string | null;
  author: { username: string; avatarUrl: string | null };
  product: { id: string; name: string; price: number } | null;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  commentCount: number;
  comments: CommentData[];
}

export function PostCard({ post }: { post: PostCardData }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.savedByMe);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    startTransition(() => {
      toggleLike(post.id);
    });
  }

  function handleSave() {
    setSaved((v) => !v);
    startTransition(() => {
      toggleSave(post.id);
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-2 font-medium">
          <Avatar src={post.author.avatarUrl} alt={post.author.username} fallback={post.author.username} size={32} />
          <span>{post.author.username}</span>
        </Link>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <Link href={post.product ? `/product/${post.product.id}` : "#"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.imageUrl} alt={post.caption ?? post.author.username} className="w-full object-cover max-h-[520px]" />
      </Link>

      <div className="flex items-center gap-4 px-4 py-3">
        <button onClick={handleLike} className="flex items-center gap-1 text-muted-foreground hover:text-destructive">
          <Heart className={cn("h-5 w-5", liked && "fill-destructive text-destructive")} />
        </button>
        <button
          onClick={() => setCommentsOpen((v) => !v)}
          className="text-muted-foreground hover:text-primary"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
        <button onClick={handleSave} className="ml-auto text-muted-foreground hover:text-primary">
          <Bookmark className={cn("h-5 w-5", saved && "fill-primary text-primary")} />
        </button>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-1">
        <span className="text-sm font-medium">{likeCount} beğenme</span>
        {post.caption && <span className="text-sm text-muted-foreground">{post.caption}</span>}
        {post.product && (
          <div className="flex flex-col gap-2 pt-1">
            <Link href={`/product/${post.product.id}`} className="text-sm text-primary hover:underline">
              {post.product.name} — {formatTL(post.product.price)}
            </Link>
            <AddToCartButton productId={post.product.id} size="sm" className="w-fit" />
          </div>
        )}
        {post.commentCount > 0 && (
          <button
            onClick={() => setCommentsOpen((v) => !v)}
            className="text-left text-sm text-muted-foreground hover:text-foreground"
          >
            {post.commentCount} yorumun tümünü gör
          </button>
        )}
      </div>

      {commentsOpen && <CommentList postId={post.id} initialComments={post.comments} />}
    </Card>
  );
}
