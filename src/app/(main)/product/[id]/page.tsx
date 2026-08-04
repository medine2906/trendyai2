import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { formatTL } from "@/lib/utils";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { ProductCommentList } from "@/components/commerce/product-comment-list";
import { Button } from "@/components/ui/button";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, comments] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.productComment.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true, avatarUrl: true } } },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="grid gap-8 sm:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="w-full rounded-xl object-cover aspect-[3/4]" />
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</span>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-xl text-primary font-medium">{formatTL(product.price)}</p>
            <p className="text-xs text-muted-foreground">{product.sourceSite}&apos;dan satılıyor</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {product.fabric && <span className="rounded-full border border-border px-3 py-1">Kumaş: {product.fabric}</span>}
            {product.season && <span className="rounded-full border border-border px-3 py-1">Sezon: {product.season}</span>}
            <span className="rounded-full border border-border px-3 py-1">Stok: {product.stock}</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <AddToCartButton productId={product.id} />
            <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-2">
                {product.sourceSite}&apos;da görüntüle
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="mb-4 text-lg font-semibold">Yorumlar ({comments.length})</h2>
        <ProductCommentList productId={product.id} initialComments={comments} />
      </div>
    </div>
  );
}
