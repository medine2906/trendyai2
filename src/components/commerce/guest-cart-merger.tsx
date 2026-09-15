"use client";

import { useEffect } from "react";
import { mergeGuestCart } from "@/lib/actions";
import { getGuestCart, clearGuestCart } from "@/lib/guest-cart";

/** Giriş yapmış bir kullanıcı, misafirken localStorage'a eklediği sepet öğeleriyle
 * herhangi bir sayfaya geldiğinde bunları hesabındaki sepete taşır (Google OAuth
 * dahil — login sayfasındaki manuel akıştan bağımsız, tek yerden çalışır). */
export function GuestCartMerger() {
  useEffect(() => {
    const items = getGuestCart();
    if (items.length === 0) return;
    mergeGuestCart(items).then(() => clearGuestCart());
  }, []);

  return null;
}
