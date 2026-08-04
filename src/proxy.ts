import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_PAGES = ["/login", "/signin", "/signup", "/forgot-password", "/login-preview-apple"];

export default auth((req) => {
  const isAuthed = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isAuthed ? "/home" : "/login", req.url));
  }

  if (isAuthPage) {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next();
  }

  if (!isAuthed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
