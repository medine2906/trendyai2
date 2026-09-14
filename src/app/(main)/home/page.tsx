import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { StoryReel } from "@/components/feed/story-reel";
import { PostCard } from "@/components/feed/post-card";
import { ProductPostCard } from "@/components/feed/product-post-card";
import { getRecommendedProducts, type RecommendedProduct } from "@/lib/recommendations";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [stories, posts, recommendedProducts] = await Promise.all([
    db.story.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.post.findMany({
      include: {
        author: true,
        product: true,
        likes: { where: { userId: userId ?? "" } },
        savedBy: { where: { userId: userId ?? "" } },
        comments: { include: { author: true }, orderBy: { createdAt: "asc" }, take: 20 },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getRecommendedProducts(userId),
  ]);

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

      <div className="mx-auto max-w-xl flex flex-col gap-6 p-6">
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
    </div>
  );
}
