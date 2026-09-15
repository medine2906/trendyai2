import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, ShoppingCart, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTL } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { LikeProductButton } from "@/components/explore/like-product-button";
import { ProductCommentList } from "@/components/commerce/product-comment-list";
import { LuxuryReelsFeed } from "./_components/luxury-reels-feed";

const LUXURY_CATEGORIES = ["Mont", "Ceket", "Trençkot", "Gömlek", "Elbise", "Kazak"];

export default async function DesignConceptsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const products = await db.product.findMany({
    where: { imageUrl: { contains: "media-amazon" }, category: { in: LUXURY_CATEGORIES } },
    take: 14,
    orderBy: { price: "desc" },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { username: true, avatarUrl: true } } },
      },
    },
  });

  const likedIds = new Set(
    (await db.productLike.findMany({ where: { userId, productId: { in: products.map((p) => p.id) } } })).map(
      (l) => l.productId
    )
  );

  const withComments = products.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    price: p.price,
    category: p.category,
    sourceSite: p.sourceSite,
    sourceUrl: p.sourceUrl,
    likedByMe: likedIds.has(p.id),
    comments: p.comments,
  }));

  const hero = withComments[0];
  const feedProducts = withComments.slice(1, 7);

  return (
    <div style={{ background: "#f4f1e4", color: "#000000", minHeight: "100vh" }}>
      {/* Üst şerit — sepet sağ üstte, konvansiyon korunuyor */}
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:px-8"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.12)", background: "rgba(244,241,228,0.94)", backdropFilter: "blur(6px)" }}
      >
        <Link href="/design-concepts" className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          ShopMind — Luxury Konsept
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/explore" className="opacity-70 hover:opacity-100" title="Keşfet">
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <Link href="/cart" className="relative opacity-70 hover:opacity-100" title="Sepetim">
            <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <Link href={`/profile/${session.user.username}`} title="Profilim">
            <Avatar src={session.user.image ?? null} alt={session.user.name ?? session.user.username} fallback={session.user.username} size={30} />
          </Link>
        </div>
      </header>

      {hero && (
        <section className="relative flex min-h-[70vh] items-end overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.imageUrl} alt={hero.name} className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(0deg, rgba(11,10,8,0.92) 0%, rgba(11,10,8,0.3) 55%, rgba(11,10,8,0.15) 100%)" }}
          />
          <div className="relative z-10 max-w-2xl px-6 pb-16 pt-24 text-white md:px-12">
            <p className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: "#b8aad0" }}>
              Bu Haftanın Seçkisi
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              {hero.name}
            </h1>
            <p className="mt-4 text-lg font-medium" style={{ color: "#b8aad0" }}>
              {formatTL(hero.price)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <AddToCartButton productId={hero.id} />
              <LikeProductButton
                productId={hero.id}
                likedByMe={hero.likedByMe}
                className="border-white/30 bg-black/30 text-white hover:bg-black/50"
              />
              <a
                href={hero.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-white/70 hover:text-white"
              >
                {hero.sourceSite}&apos;da görüntüle
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        {/* AI sohbet paneli — gerçek /chat'e bağlı */}
        <section className="mb-20 max-w-xl">
          <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            AI ile ara
          </h2>
          <div style={{ border: "1px solid rgba(0,0,0,0.15)", background: "#fcfaf1" }}>
            <div className="flex flex-col gap-3 p-4">
              <div className="ml-auto max-w-[80%] px-3 py-2 text-sm" style={{ background: "#6b579e", color: "#fcfaf1" }}>
                Düğünde giyeceğim, rüzgarlı olacak, uçuşmasın istiyorum.
              </div>
              <div className="mr-auto max-w-[85%] px-3 py-2 text-sm" style={{ background: "#ebe7d8" }}>
                Dar kesim bir trençkot veya kapitone bir ceket öneririm — geniş etek/uçuşan
                kumaştan kaçınıp yapılandırılmış bir silüet seçtim. İşte 3 seçenek:
              </div>
            </div>
            <Link
              href="/chat"
              className="block px-4 py-3 text-center text-xs font-medium uppercase tracking-wider"
              style={{ borderTop: "1px solid rgba(0,0,0,0.12)", color: "#6b579e" }}
            >
              Gerçek sohbete başla →
            </Link>
          </div>
        </section>

        {/* Ana feed — Instagram ana sayfa tarzı, gerçek beğeni/sepet/yorum */}
        <section className="mb-20">
          <h2 className="mb-6 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Senin İçin Önerilenler
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {feedProducts.map((product) => (
              <div key={product.id} style={{ border: "1px solid rgba(0,0,0,0.12)", background: "#fcfaf1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} alt={product.name} className="w-full object-cover" style={{ aspectRatio: "4 / 5" }} />
                <div className="flex flex-col gap-1 px-4 pt-3">
                  <span className="text-xs uppercase tracking-wide" style={{ color: "#6b6a60" }}>
                    {product.category}
                  </span>
                  <span className="text-sm font-medium">{product.name}</span>
                  <span className="text-sm font-semibold" style={{ color: "#6b579e" }}>
                    {formatTL(product.price)}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <LikeProductButton productId={product.id} likedByMe={product.likedByMe} />
                  <AddToCartButton productId={product.id} size="sm" />
                  <a
                    href={product.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs"
                    style={{ color: "#6b6a60" }}
                  >
                    {product.sourceSite}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="border-t px-4 py-3" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                  <ProductCommentList productId={product.id} initialComments={product.comments} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Keşfet — Reels tarzı dikey kaydırma, gerçek etkileşim */}
        <section>
          <h2 className="mb-6 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Keşfet — Kaydırarak Gez
          </h2>
          <div className="mx-auto max-w-md">
            <LuxuryReelsFeed products={withComments} />
          </div>
        </section>
      </main>
    </div>
  );
}
