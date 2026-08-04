"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { addProductComment } from "@/lib/actions";

export interface ProductCommentData {
  id: string;
  content: string;
  author: { username: string; avatarUrl: string | null };
}

export function ProductCommentList({
  productId,
  initialComments,
  className,
}: {
  productId: string;
  initialComments: ProductCommentData[];
  className?: string;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !session?.user) return;

    setComments((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        content: trimmed,
        author: { username: session.user.username, avatarUrl: session.user.image ?? null },
      },
    ]);
    setContent("");
    startTransition(() => {
      addProductComment(productId, trimmed);
    });
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Henüz yorum yok — ilk yorumu sen yaz.</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2">
            <Avatar
              src={comment.author.avatarUrl}
              alt={comment.author.username}
              fallback={comment.author.username}
              size={28}
            />
            <p className="text-sm">
              <span className="font-medium">{comment.author.username}</span>{" "}
              <span className="text-muted-foreground">{comment.content}</span>
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bu ürün hakkında yorum yaz..."
          maxLength={500}
          className="h-9"
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="shrink-0 text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
        >
          Paylaş
        </button>
      </form>
    </div>
  );
}
