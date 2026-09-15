import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StoryReel } from "@/components/feed/story-reel";
import { PostCard } from "@/components/feed/post-card";
import { ProductPostCard } from "@/components/feed/product-post-card";
import { HomeRightRail, type RailNotification } from "@/components/feed/home-right-rail";
import { getRecommendedProducts, type RecommendedProduct } from "@/lib/recommendations";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [stories, posts, recommendedProducts, followingIds, recentLikes, recentFollows] = await Promise.all([
    db.story.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.post.findMany({
      include: {
        author: true,
        product: true,
        likes: { where: { userId } },
        savedBy: { where: { userId } },
        comments: { include: { author: true }, orderBy: { createdAt: "asc" }, take: 20 },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getRecommendedProducts(userId),
    db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    db.like.findMany({
      where: { post: { authorId: userId } },
      select: { id: true, createdAt: true, user: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.follow.findMany({
      where: { followingId: userId },
      select: { id: true, createdAt: true, follower: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const suggestions = await db.user.findMany({
    where: { id: { notIn: [userId, ...followingIds.map((f) => f.followingId)] } },
    take: 5,
  });

  const notifications: RailNotification[] = [
    ...recentLikes.map((l) => ({
      id: `like-${l.id}`,
      type: "like" as const,
      actor: l.user,
      createdAt: l.createdAt,
    })),
    ...recentFollows.map((f) => ({
      id: `follow-${f.id}`,
      type: "follow" as const,
      actor: f.follower,
      createdAt: f.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  type FeedItem =
    | { type: "post"; data: (typeof posts)[number] }
    | { type: "product"; data: RecommendedProduct };

  const feedItems: FeedItem[] = [];
  const products = [...recommendedProducts];
  posts.forEach((post, i) => {
    feedItems.push({ type: "post", data: post });
    if ((i + 1) % 2 === 0 && products.length > 0) {
      feedItems.push({ type: "product", data: products.shift()! });
    }
  });
  feedItems.push(...products.map((product) => ({ type: "product" as const, data: product })));

  return (
    <div>
      <StoryReel
        stories={stories.map((s) => ({
          id: s.id,
          username: s.user.username,
          avatarUrl: s.user.avatarUrl,
          imageUrl: s.imageUrl,
        }))}
      />

      <div className="mx-auto flex max-w-4xl items-start justify-center gap-6 px-4 lg:px-6">
        <div className="flex w-full max-w-xl flex-col gap-6 py-6">
          {feedItems.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Henüz gönderi yok.</p>
          )}
          {feedItems.map((item) =>
            item.type === "post" ? (
              <PostCard
                key={`post-${item.data.id}`}
                post={{
                  id: item.data.id,
                  imageUrl: item.data.imageUrl,
                  caption: item.data.caption,
                  author: { username: item.data.author.username, avatarUrl: item.data.author.avatarUrl },
                  product: item.data.product
                    ? { id: item.data.product.id, name: item.data.product.name, price: item.data.product.price }
                    : null,
                  likeCount: item.data._count.likes,
                  likedByMe: item.data.likes.length > 0,
                  savedByMe: item.data.savedBy.length > 0,
                  commentCount: item.data._count.comments,
                  comments: item.data.comments.map((c) => ({
                    id: c.id,
                    content: c.content,
                    author: { username: c.author.username, avatarUrl: c.author.avatarUrl },
                  })),
                }}
              />
            ) : (
              <ProductPostCard key={`product-${item.data.id}`} product={item.data} />
            )
          )}
        </div>

        <HomeRightRail
          suggestions={suggestions.map((u) => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl }))}
          notifications={notifications}
        />
      </div>
    </div>
  );
}
