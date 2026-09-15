import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { ProfileFollowButton } from "@/components/profile/profile-follow-button";
import { MessageButton } from "@/components/profile/message-button";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      posts: { orderBy: { createdAt: "desc" } },
      _count: { select: { followers: true, following: true, posts: true } },
    },
  });
  if (!user) notFound();

  const isMe = currentUserId === user.id;
  const alreadyFollowing =
    isMe || !currentUserId
      ? false
      : Boolean(
          await db.follow.findUnique({
            where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
          })
        );
  const canViewPosts = isMe || !user.isPrivate || alreadyFollowing;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-8">
        <Avatar src={user.avatarUrl} alt={user.username} fallback={user.username} size={96} />
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            {!isMe && <ProfileFollowButton targetUserId={user.id} initialFollowing={alreadyFollowing} />}
            {!isMe && <MessageButton targetUserId={user.id} />}
            {isMe && (
              <Link
                href="/create"
                className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted"
              >
                Gönderi paylaş
              </Link>
            )}
          </div>
          <div className="mt-3 flex gap-6 text-sm">
            <span>
              <strong>{user._count.posts}</strong> gönderi
            </span>
            <Link href={`/profile/${user.username}/follows/followers`} className="hover:underline">
              <strong>{user._count.followers}</strong> takipçi
            </Link>
            <Link href={`/profile/${user.username}/follows/following`} className="hover:underline">
              <strong>{user._count.following}</strong> takip
            </Link>
          </div>
          {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}
        </div>
      </div>

      {canViewPosts ? (
        <div className="mt-8 grid grid-cols-3 gap-1 sm:gap-3">
          {user.posts.map((post) => (
            <Link key={post.id} href={`/product/${post.productId ?? ""}`} className="block overflow-hidden rounded-md sm:rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl} alt="" className="aspect-square w-full object-cover" />
            </Link>
          ))}
          {user.posts.length === 0 && (
            <p className="col-span-3 py-12 text-center text-muted-foreground">Henüz gönderi yok.</p>
          )}
        </div>
      ) : (
        <div className="mt-8 py-16 text-center text-muted-foreground">
          <p className="font-medium">Bu hesap gizli</p>
          <p className="mt-1 text-sm">Gönderileri görmek için bu kullanıcıyı takip etmelisin.</p>
        </div>
      )}
    </div>
  );
}
