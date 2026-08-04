import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MessageButton } from "@/components/profile/message-button";

export default async function FollowsPage({
  params,
}: {
  params: Promise<{ username: string; tab: string }>;
}) {
  const { username, tab } = await params;
  if (tab !== "followers" && tab !== "following") notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");
  const currentUserId = session.user.id;

  const user = await db.user.findUnique({ where: { username } });
  if (!user) notFound();

  const isMe = currentUserId === user.id;
  const alreadyFollowing = isMe
    ? false
    : Boolean(
        await db.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
        })
      );
  if (user.isPrivate && !isMe && !alreadyFollowing) notFound();

  const relations =
    tab === "followers"
      ? await db.follow.findMany({
          where: { followingId: user.id },
          include: { follower: true },
          orderBy: { createdAt: "desc" },
        })
      : await db.follow.findMany({
          where: { followerId: user.id },
          include: { following: true },
          orderBy: { createdAt: "desc" },
        });

  const people = relations.map((r) =>
    tab === "followers"
      ? (r as { follower: typeof user }).follower
      : (r as { following: typeof user }).following
  );

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-border">
        <Link
          href={`/profile/${username}/follows/followers`}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2",
            tab === "followers" ? "border-foreground" : "border-transparent text-muted-foreground"
          )}
        >
          Takipçiler
        </Link>
        <Link
          href={`/profile/${username}/follows/following`}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2",
            tab === "following" ? "border-foreground" : "border-transparent text-muted-foreground"
          )}
        >
          Takip Edilenler
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        {people.map((person) => (
          <div key={person.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted">
            <Link href={`/profile/${person.username}`} className="flex flex-1 items-center gap-3 min-w-0">
              <Avatar src={person.avatarUrl} alt={person.username} fallback={person.username} size={40} />
              <span className="truncate text-sm font-medium">{person.username}</span>
            </Link>
            {person.id !== currentUserId && <MessageButton targetUserId={person.id} />}
          </div>
        ))}
        {people.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {tab === "followers" ? "Henüz takipçi yok." : "Henüz kimse takip edilmiyor."}
          </p>
        )}
      </div>
    </div>
  );
}
