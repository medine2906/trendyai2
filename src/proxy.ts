import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_PAGES = ["/login", "/signin", "/signup", "/forgot-password", "/login-preview-apple"];

// Sadece hesaba özel sayfalar (bildirimler, mesajlar, arama geçmişi, ayarlar,
// kaydedilenler, gönderi paylaşma) giriş gerektirir. Ana sayfa, keşfet, sohbet
// (AI arama), ürün detay, sepet ve profil sayfaları misafir kullanıcıya da
// açık — giriş/kayıt sadece hesaba bağlı bir eylemde (beğenme, kaydetme,
// takip, mesaj, sepetten hesaba geçiş vb.) istenir.
const PROTECTED_PREFIXES = ["/messages", "/activity", "/history", "/settings", "/saved", "/create"];

export default auth((req) => {
  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (isAuthPage) {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (isProtected && !isAuthed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
