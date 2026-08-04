import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExploreGrid } from "@/components/explore/explore-grid";

export default async function ExplorePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [products, myLikes] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        price: true,
        category: true,
        sourceSite: true,
        sourceUrl: true,
      },
    }),
    db.productLike.findMany({ where: { userId }, select: { productId: true } }),
  ]);
  const likedSet = new Set(myLikes.map((l) => l.productId));

  const feedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    category: product.category,
    sourceSite: product.sourceSite,
    sourceUrl: product.sourceUrl,
    likedByMe: likedSet.has(product.id),
  }));

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Keşfet</h1>
      <ExploreGrid products={feedProducts} />
    </div>
  );
}
