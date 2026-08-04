"use client";

import { ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { LikeProductButton } from "@/components/explore/like-product-button";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { formatTL } from "@/lib/utils";
import type { RecommendedProduct } from "@/lib/recommendations";

export function ProductPostCard({ product }: { product: RecommendedProduct }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-medium">
          <Avatar src={null} alt={product.sourceSite} fallback={product.sourceSite} size={32} />
          <div className="flex flex-col leading-tight">
            <span>{product.sourceSite}</span>
            <span className="text-xs font-normal text-primary">{product.reason}</span>
          </div>
        </div>
      </div>

      <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="w-full object-cover max-h-[520px]" />
      </a>

      <div className="flex items-center gap-4 px-4 py-3">
        <LikeProductButton productId={product.id} likedByMe={product.likedByMe} className="h-9 w-9" />
        <a
          href={product.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          {product.sourceSite}&apos;da görüntüle
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-1">
        <a
          href={product.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:text-primary"
        >
          {product.name}
        </a>
        <span className="text-sm font-medium text-primary">{formatTL(product.price)}</span>
        <AddToCartButton productId={product.id} size="sm" className="w-fit mt-1" />
      </div>
    </Card>
  );
}
