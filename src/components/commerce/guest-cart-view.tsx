"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGuestCart, onGuestCartChange, type GuestCartItem } from "@/lib/guest-cart";
import { GuestCartItemRow } from "@/components/commerce/guest-cart-item-row";
import { formatTL } from "@/lib/utils";

interface GuestProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  sourceSite: string;
  sourceUrl: string;
}

export function GuestCartView() {
  const [items, setItems] = useState<GuestCartItem[] | null>(null);
  const [products, setProducts] = useState<Record<string, GuestProduct>>({});

  async function load() {
    const current = getGuestCart();
    setItems(current);
    if (current.length === 0) {
      setProducts({});
      return;
    }
    const res = await fetch(`/api/products/by-ids?ids=${current.map((i) => i.productId).join(",")}`);
    const data: { products: GuestProduct[] } = await res.json();
    setProducts(Object.fromEntries(data.products.map((p) => [p.id, p])));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- misafir sepetini localStorage'dan hidratlar
    load();
    return onGuestCartChange(load);
  }, []);

  if (items === null) return null;

  const rows = items
    .map((item) => ({ item, product: products[item.productId] }))
    .filter((r): r is { item: GuestCartItem; product: GuestProduct } => !!r.product);

  const total = rows.reduce((sum, r) => sum + r.product.price * r.item.quantity, 0);

  return (
    <div>
      <p className="mb-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Misafir olarak alışveriş yapıyorsun, sepetin bu cihazda saklanır.{" "}
        <Link href="/login?callbackUrl=/cart" className="text-primary hover:underline">
          Giriş yap
        </Link>{" "}
        veya{" "}
        <Link href="/signup?callbackUrl=/cart" className="text-primary hover:underline">
          kayıt ol
        </Link>
        , sepetin hesabına aktarılsın.
      </p>
      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Sepetiniz boş.</p>
      ) : (
        <>
          <div className="flex flex-col">
            {rows.map(({ item, product }) => (
              <GuestCartItemRow
                key={item.productId}
                item={{ productId: item.productId, quantity: item.quantity, product }}
                onChange={load}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-lg font-semibold">Toplam</span>
            <span className="text-lg font-semibold">{formatTL(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
