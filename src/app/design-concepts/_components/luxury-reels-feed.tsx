"use client";

import { ExternalLink } from "lucide-react";
import { formatTL } from "@/lib/utils";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { LikeProductButton } from "@/components/explore/like-product-button";
import { ProductCommentList, type ProductCommentData } from "@/components/commerce/product-comment-list";

export type ReelProduct = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  category: string;
  sourceSite: string;
  sourceUrl: string;
  likedByMe: boolean;
  comments: ProductCommentData[];
};

// Trendyol/Amazon/Hepsiburada'daki alışılmış "sepet sağ üst" konumu bu bölümde
// de korunuyor — sadece bu ürün kartının kendi köşesinde (feed başlığında değil,
// her ürün panelinin sağ üstünde) tekrarlanan bir mini rozet olarak gösteriliyor.
export function LuxuryReelsFeed({ products }: { products: ReelProduct[] }) {
  return (
    <div
      className="relative flex flex-col gap-[2px] overflow-y-auto"
      style={{ height: "82vh", scrollSnapType: "y mandatory", background: "#000" }}
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="relative flex shrink-0 items-end justify-center"
          style={{ height: "82vh", scrollSnapAlign: "start" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)" }}
          />

          <div className="relative z-10 flex w-full max-w-md flex-col gap-3 px-5 pb-8 text-white">
            <div>
              <span
                className="text-xs font-medium uppercase tracking-[0.2em]"
                style={{ color: "#b8aad0" }}
              >
                {product.category}
              </span>
              <h3 className="mt-1 text-lg font-semibold leading-tight">{product.name}</h3>
              <p className="mt-1 text-sm font-semibold" style={{ color: "#b8aad0" }}>
                {formatTL(product.price)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <LikeProductButton
                productId={product.id}
                likedByMe={product.likedByMe}
                className="border-white/30 bg-black/30 text-white hover:bg-black/50"
              />
              <AddToCartButton productId={product.id} size="sm" />
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-white/70 hover:text-white"
              >
                {product.sourceSite}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div
              className="max-h-40 overflow-y-auto border-t p-3"
              style={{ borderColor: "rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)" }}
            >
              <ProductCommentList productId={product.id} initialComments={product.comments} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
