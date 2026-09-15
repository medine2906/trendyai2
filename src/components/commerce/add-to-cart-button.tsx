"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useSession } from "next-auth/react";
import { ShoppingCart } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { addToCart } from "@/lib/actions";
import { addGuestCartItem } from "@/lib/guest-cart";

export function AddToCartButton({
  productId,
  size = "default",
  className,
}: {
  productId: string;
  size?: ButtonProps["size"];
  className?: string;
}) {
  const { data: session } = useSession();
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      addGuestCartItem(productId);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      return;
    }
    startTransition(async () => {
      await addToCart(productId);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending} size={size} className={className}>
      <ShoppingCart className="h-4 w-4" />
      {added ? "Sepete Eklendi" : "Sepete Ekle"}
    </Button>
  );
}
