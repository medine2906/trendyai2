import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_PAGES = ["/login", "/signin", "/signup", "/forgot-password", "/login-preview-apple"];

// Trendyol'daki gibi: gezinmek (feed, keşfet, AI sohbet/arama, ürün sayfaları,
// sepet) hesap gerektirmez. Hesap sadece kimliğe bağlı sosyal eylemler
// (beğenme, yorum, takip, mesaj, bildirim, gönderi paylaşma, geçmiş aramalar,
// ayarlar, profil) için gerekiyor — o sayfalara girildiğinde burada giriş
// ekranına yönlendirilir.
const PUBLIC_PREFIXES = ["/home", "/explore", "/chat", "/product", "/cart"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

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

  if (!isAuthed && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
