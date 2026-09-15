"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, ExternalLink } from "lucide-react";
import { updateGuestCartItem, removeGuestCartItem } from "@/lib/guest-cart";
import { formatTL } from "@/lib/utils";
import type { CartItemData } from "@/components/commerce/cart-item-row";

export function GuestCartItemRow({
  item,
  onChange,
}: {
  item: Omit<CartItemData, "id"> & { productId: string };
  onChange: () => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);

  function changeQuantity(next: number) {
    if (next < 0) return;
    setQuantity(next);
    updateGuestCartItem(item.productId, next);
    onChange();
  }

  function remove() {
    removeGuestCartItem(item.productId);
    onChange();
  }

  return (
    <div className="flex items-center gap-4 border-b border-border py-4">
      <a href={item.product.sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.product.imageUrl} alt={item.product.name} className="h-20 w-16 rounded-md object-cover" />
      </a>
      <div className="flex-1 min-w-0">
        <a
          href={item.product.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium hover:text-primary truncate"
        >
          <span className="truncate">{item.product.name}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
        </a>
        <p className="text-sm text-muted-foreground">
          {formatTL(item.product.price)} · {item.product.sourceSite}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => changeQuantity(quantity - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm">{quantity}</span>
        <button
          onClick={() => changeQuantity(quantity + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <p className="w-20 text-right text-sm font-medium">{formatTL(item.product.price * quantity)}</p>
      <button onClick={remove} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
