"use client";

const STORAGE_KEY = "shopmind_guest_cart";
const CHANGE_EVENT = "shopmind-guest-cart-changed";

export interface GuestCartItem {
  productId: string;
  quantity: number;
}

function read(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is GuestCartItem =>
        typeof item?.productId === "string" && typeof item?.quantity === "number" && item.quantity > 0
    );
  } catch {
    return [];
  }
}

function write(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getGuestCart(): GuestCartItem[] {
  return read();
}

export function addGuestCartItem(productId: string, quantity = 1) {
  const items = read();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }
  write(items);
}

export function updateGuestCartItem(productId: string, quantity: number) {
  const items = read();
  if (quantity <= 0) {
    write(items.filter((i) => i.productId !== productId));
    return;
  }
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = quantity;
    write(items);
  }
}

export function removeGuestCartItem(productId: string) {
  write(read().filter((i) => i.productId !== productId));
}

export function clearGuestCart() {
  write([]);
}

export function onGuestCartChange(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
