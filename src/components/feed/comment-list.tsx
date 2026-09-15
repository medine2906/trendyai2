"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { addComment } from "@/lib/actions";
import { useRequireAuth } from "@/lib/use-require-auth";

export interface CommentData {
  id: string;
  content: string;
  author: { username: string; avatarUrl: string | null };
}

export function CommentList({ postId, initialComments }: { postId: string; initialComments: CommentData[] }) {
  const { data: session } = useSession();
  const { requireAuth } = useRequireAuth();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    if (!requireAuth() || !session?.user) return;

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
      addComment(postId, trimmed);
    });
  }

  return (
    <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
      {comments.length === 0 && <p className="text-sm text-muted-foreground">Henüz yorum yok.</p>}
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
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Yorum ekle..."
          maxLength={500}
          className="h-8"
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
        >
          Paylaş
        </button>
      </form>
    </div>
  );
}
