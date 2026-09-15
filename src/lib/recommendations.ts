import type { Product } from "@prisma/client";
import { db } from "@/lib/db";

export interface RecommendedProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  category: string;
  sourceSite: string;
  sourceUrl: string;
  likedByMe: boolean;
  reason: string;
}

export async function getRecommendedProducts(userId: string | null, take = 12): Promise<RecommendedProduct[]> {
  const [myLikes, followingRows] = userId
    ? await Promise.all([
        db.productLike.findMany({
          where: { userId },
          select: { productId: true, product: { select: { category: true } } },
        }),
        db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
      ])
    : [[], []];

  const likedProductIds = new Set(myLikes.map((l) => l.productId));
  const followingIds = followingRows.map((f) => f.followingId);

  const picked = new Map<string, { product: Product; reason: string }>();

  // 1) Products liked by people the user follows — strongest signal.
  if (followingIds.length > 0) {
    const likedByFollowing = await db.productLike.findMany({
      where: { userId: { in: followingIds }, productId: { notIn: [...likedProductIds] } },
      include: { product: true, user: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: take * 2,
    });
    for (const like of likedByFollowing) {
      if (picked.has(like.productId)) continue;
      picked.set(like.productId, { product: like.product, reason: `${like.user.username} beğendi` });
    }
  }

  // 2) Products similar (same category) to what the user has already liked.
  if (picked.size < take && myLikes.length > 0) {
    const categories = [...new Set(myLikes.map((l) => l.product.category))];
    const similar = await db.product.findMany({
      where: {
        category: { in: categories },
        id: { notIn: [...likedProductIds, ...picked.keys()] },
      },
      orderBy: { createdAt: "desc" },
      take: take * 2,
    });
    for (const product of similar) {
      if (picked.size >= take * 2) break;
      if (picked.has(product.id)) continue;
      picked.set(product.id, { product, reason: "Beğendiklerine benzer" });
    }
  }

  // 3) Fallback — fill remaining slots with recent products so the rail is never empty.
  if (picked.size < take) {
    const fallback = await db.product.findMany({
      where: { id: { notIn: [...likedProductIds, ...picked.keys()] } },
      orderBy: { createdAt: "desc" },
      take,
    });
    for (const product of fallback) {
      if (picked.size >= take) break;
      if (picked.has(product.id)) continue;
      picked.set(product.id, { product, reason: "Yeni eklendi" });
    }
  }

  return [...picked.values()]
    .slice(0, take)
    .map(({ product, reason }) => ({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      category: product.category,
      sourceSite: product.sourceSite,
      sourceUrl: product.sourceUrl,
      likedByMe: likedProductIds.has(product.id),
      reason,
    }));
}
