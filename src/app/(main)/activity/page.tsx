import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Heart, UserPlus } from "lucide-react";
import { SuggestionList } from "@/components/feed/suggestion-card";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}s`;
  return `${Math.floor(hours / 24)}g`;
}

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;
  const [likes, comments, follows, followingIds] = await Promise.all([
    db.like.findMany({
      where: { post: { authorId: userId } },
      select: {
        id: true,
        postId: true,
        createdAt: true,
        user: { select: { username: true, avatarUrl: true } },
        post: { select: { imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.comment.findMany({
      where: { post: { authorId: userId } },
      select: {
        id: true,
        postId: true,
        content: true,
        createdAt: true,
        author: { select: { username: true, avatarUrl: true } },
        post: { select: { imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.follow.findMany({
      where: { followingId: userId },
      select: {
        id: true,
        createdAt: true,
        follower: { select: { username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
  ]);

  await db.user.update({ where: { id: userId }, data: { notificationsCheckedAt: new Date() } });

  const followingSet = new Set(followingIds.map((f) => f.followingId));
  const suggestions = await db.user.findMany({
    where: { id: { notIn: [userId, ...followingSet] } },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Bildirimler</h1>

      {suggestions.length > 0 && (
        <div className="mb-8 border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground">Senin için önerilenler</h2>
          </div>
          <SuggestionList
            suggestions={suggestions.map((u) => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl }))}
          />
        </div>
      )}

      <Tabs defaultValue="likes">
        <TabsList>
          <TabsTrigger value="likes">Beğenmeler</TabsTrigger>
          <TabsTrigger value="comments">Yorumlar</TabsTrigger>
          <TabsTrigger value="follows">Takipçiler</TabsTrigger>
        </TabsList>
        <TabsContent value="likes">
          <div className="mt-4 flex flex-col divide-y divide-border">
            {likes.length === 0 && <p className="py-8 text-center text-muted-foreground">Henüz beğeni yok.</p>}
            {likes.map((like) => (
              <div key={like.id} className="flex items-center gap-3 py-3">
                <Heart className="h-4 w-4 text-destructive shrink-0" />
                <Avatar src={like.user.avatarUrl} alt={like.user.username} fallback={like.user.username} size={32} />
                <p className="flex-1 text-sm">
                  <span className="font-medium">{like.user.username}</span> gönderini beğendi.
                  <span className="ml-2 text-muted-foreground">{timeAgo(like.createdAt)}</span>
                </p>
                <Link href={`/product/${like.postId}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={like.post.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                </Link>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="comments">
          <div className="mt-4 flex flex-col divide-y divide-border">
            {comments.length === 0 && <p className="py-8 text-center text-muted-foreground">Henüz yorum yok.</p>}
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-center gap-3 py-3">
                <Avatar
                  src={comment.author.avatarUrl}
                  alt={comment.author.username}
                  fallback={comment.author.username}
                  size={32}
                />
                <p className="flex-1 text-sm">
                  <span className="font-medium">{comment.author.username}</span> gönderine yorum yaptı:{" "}
                  <span className="text-muted-foreground">{comment.content}</span>
                  <span className="ml-2 text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                </p>
                <Link href={`/product/${comment.postId}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={comment.post.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                </Link>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="follows">
          <div className="mt-4 flex flex-col divide-y divide-border">
            {follows.length === 0 && <p className="py-8 text-center text-muted-foreground">Henüz takipçi yok.</p>}
            {follows.map((follow) => (
              <Link
                key={follow.id}
                href={`/profile/${follow.follower.username}`}
                className="flex items-center gap-3 py-3"
              >
                <UserPlus className="h-4 w-4 text-primary shrink-0" />
                <Avatar
                  src={follow.follower.avatarUrl}
                  alt={follow.follower.username}
                  fallback={follow.follower.username}
                  size={32}
                />
                <p className="flex-1 text-sm">
                  <span className="font-medium">{follow.follower.username}</span> seni takip etmeye başladı.
                  <span className="ml-2 text-muted-foreground">{timeAgo(follow.createdAt)}</span>
                </p>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
