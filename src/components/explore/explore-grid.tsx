"use client";

import { useState } from "react";
import { ExploreFeed } from "./explore-feed";

type ExploreProduct = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  category: string;
  sourceSite: string;
  sourceUrl: string;
  likedByMe: boolean;
};

export function ExploreGrid({ products }: { products: ExploreProduct[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: "5px" }}>
        {products.map((product, index) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative block overflow-hidden text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="truncate text-xs font-medium text-white">{product.name}</p>
            </div>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <ExploreFeed products={products} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
