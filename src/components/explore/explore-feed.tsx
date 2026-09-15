"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { formatTL } from "@/lib/utils";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { LikeProductButton } from "@/components/explore/like-product-button";
import { Button } from "@/components/ui/button";
import type { OpenOrigin } from "@/components/explore/explore-grid";

type FeedProduct = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  category: string;
  sourceSite: string;
  sourceUrl: string;
  likedByMe: boolean;
};

const BATCH_SIZE = 6;
const TRANSITION_MS = 240;

function clipPathFromOrigin(origin: OpenOrigin) {
  const right = Math.max(0, window.innerWidth - origin.right);
  const bottom = Math.max(0, window.innerHeight - origin.bottom);
  return `inset(${origin.top}px ${right}px ${bottom}px ${origin.left}px)`;
}

export function ExploreFeed({
  products,
  startIndex,
  origin,
  onClose,
}: {
  products: FeedProduct[];
  startIndex: number;
  origin?: OpenOrigin;
  onClose: () => void;
}) {
  const [count, setCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const items = Array.from({ length: count }, (_, i) => products[(startIndex + i) % products.length]);

  // Tıklanan ürün karesinden tam ekrana "büyüyerek açılma" animasyonu: overlay'i
  // önce tıklanan karenin boyutuna clip-path ile kısıtlayıp bir sonraki frame'de
  // tam ekrana genişletiyoruz (CSS transition clip-path'i animasyonluyor).
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !origin) return;
    el.style.transition = "none";
    el.style.clipPath = clipPathFromOrigin(origin);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `clip-path ${TRANSITION_MS}ms ease`;
        el.style.clipPath = "inset(0px 0px 0px 0px)";
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    const el = overlayRef.current;
    if (!el || !origin) {
      onClose();
      return;
    }
    setIsClosing(true);
    el.style.transition = `clip-path ${TRANSITION_MS}ms ease`;
    el.style.clipPath = clipPathFromOrigin(origin);
    window.setTimeout(onClose, TRANSITION_MS);
  }, [origin, onClose]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setCount((c) => c + BATCH_SIZE);
      },
      { root: scrollContainerRef.current, rootMargin: "1000px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleClose]);

  if (products.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-background"
      style={{ overflow: "hidden", pointerEvents: isClosing ? "none" : "auto" }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute rounded-none bg-black/50 text-white"
        style={{ right: "1rem", top: "1rem", zIndex: 10 }}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Kapat</span>
      </Button>
      <div ref={scrollContainerRef} className="h-full" style={{ overflowY: "auto", scrollBehavior: "smooth" }}>
        <div className="mx-auto flex flex-col" style={{ maxWidth: "28rem", gap: "1.5rem", paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
          {items.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              className="flex flex-col gap-3 border-b border-border px-4"
              style={{ paddingBottom: "1.5rem" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full object-cover"
                style={{ aspectRatio: "3 / 4" }}
              />
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</span>
                <h2 className="text-lg font-semibold">{product.name}</h2>
                <p className="font-medium text-primary">{formatTL(product.price)}</p>
              </div>
              <div className="flex gap-2">
                <LikeProductButton productId={product.id} likedByMe={product.likedByMe} />
                <AddToCartButton productId={product.id} />
                <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    {product.sourceSite}&apos;da görüntüle
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
          <div ref={sentinelRef} style={{ height: "1rem" }} />
        </div>
      </div>
    </div>
  );
}
