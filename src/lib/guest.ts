import { cookies } from "next/headers";
import { randomUUID } from "crypto";

// Giriş yapmamış ("misafir") ziyaretçilerin sepetini bir hesaba değil, bu
// cookie'deki rastgele kimliğe bağlamak için kullanılıyor — Trendyol'da olduğu
// gibi hesap açmadan sepete ürün eklenebilsin diye.
const GUEST_COOKIE = "guest_id";

export async function getGuestId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}

export async function getOrCreateGuestId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}

export async function clearGuestId() {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}
