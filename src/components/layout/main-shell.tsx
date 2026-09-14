"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Flame,
  Home,
  PlusSquare,
  Compass,
  MessageSquare,
  History,
  ShoppingCart,
  Menu,
  Settings,
  Bookmark,
  Sun,
  Moon,
  Bell,
  LogIn,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/home", label: "Ana sayfa", icon: Home },
  { href: "/chat", label: "Yeni sohbet", icon: PlusSquare },
  { href: "/explore", label: "Keşfet", icon: Compass },
  { href: "/activity", label: "Bildirimler", icon: Bell, badgeKey: "notifications" as const },
  { href: "/messages", label: "Mesajlar", icon: MessageSquare, badgeKey: "messages" as const },
  { href: "/history", label: "Geçmiş aramalar", icon: History },
];

const SIDEBAR_WIDTH_COLLAPSED = 68;
const SIDEBAR_WIDTH_EXPANDED = 220;

export function MainShell({
  children,
  user,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}: {
  children: React.ReactNode;
  user: { name: string; username: string; avatarUrl: string | null } | null;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}) {
  const isGuest = !user;
  const badgeCounts = { messages: unreadMessagesCount, notifications: unreadNotificationsCount };
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(document.documentElement.classList.contains("dark"));
  };

  return (
    <div className="min-h-screen w-full">
      <Tooltip content="Sepetim" side="left">
        <Link
          href="/cart"
          className={cn(
            "fixed right-3 top-3 z-50 flex h-10 w-10 items-center justify-center border border-border bg-card shadow-sm hover:text-primary",
            pathname === "/cart" && "text-primary"
          )}
        >
          <ShoppingCart className="h-6 w-6" strokeWidth={2.25} />
          <span className="sr-only">Sepetim</span>
        </Link>
      </Tooltip>

      <aside
        className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen z-40 border-r transition-[width] duration-200"
        style={{
          width: isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
          background: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <div
          className={cn(
            "flex h-full w-full flex-col gap-2 py-4",
            isSidebarExpanded ? "items-stretch px-3" : "items-center"
          )}
        >
          <button
            type="button"
            onClick={() => setIsSidebarExpanded((v) => !v)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 mb-2",
              isSidebarExpanded ? "justify-start px-2" : "w-10 justify-center"
            )}
            style={{ color: "var(--foreground)" }}
          >
            <Flame className="h-6 w-6 shrink-0" strokeWidth={2.25} />
            {isSidebarExpanded && (
              <span className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
                TrendAI
              </span>
            )}
            <span className="sr-only">Menüyü aç/kapat</span>
          </button>

          <nav
            className={cn(
              "flex flex-1 flex-col gap-1 overflow-auto",
              isSidebarExpanded ? "items-stretch w-full" : "items-center w-full"
            )}
          >
            {navLinks.map((link) => {
              const count = link.badgeKey ? badgeCounts[link.badgeKey] : 0;
              const active = pathname === link.href;
              const linkEl = (
                <Link
                  href={link.href}
                  className={cn(
                    "relative flex h-11 shrink-0 items-center border-l-2 transition-colors hover:text-foreground",
                    isSidebarExpanded ? "w-full gap-3 px-3" : "w-11 justify-center"
                  )}
                  style={{
                    borderColor: active ? "var(--foreground)" : "transparent",
                    color: active ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  <span className="relative shrink-0">
                    <link.icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                    {count > 0 && (
                      <span
                        className="absolute flex h-4 items-center justify-center px-1 font-semibold"
                        style={{
                          top: "-6px",
                          right: "-6px",
                          minWidth: "16px",
                          fontSize: "10px",
                          backgroundColor: "var(--accent)",
                          color: "var(--accent-foreground)",
                        }}
                      >
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </span>
                  {isSidebarExpanded && <span className="uppercase tracking-wide text-xs">{link.label}</span>}
                </Link>
              );

              if (isSidebarExpanded) return <div key={link.href}>{linkEl}</div>;

              return (
                <Tooltip key={link.href} content={link.label} side="right">
                  {linkEl}
                </Tooltip>
              );
            })}
          </nav>

          {isGuest ? (
            <Tooltip content="Giriş Yap" side="right">
              <Link
                href="/login"
                className={cn(
                  "flex h-11 shrink-0 items-center border-l-2 border-transparent text-muted-foreground hover:text-foreground",
                  isSidebarExpanded ? "w-full gap-3 px-3" : "w-11 justify-center"
                )}
              >
                <LogIn className="h-6 w-6" strokeWidth={2.25} />
                {isSidebarExpanded && <span className="uppercase tracking-wide text-xs">Giriş Yap</span>}
              </Link>
            </Tooltip>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div
                  className={cn(
                    "flex h-11 shrink-0 items-center border-l-2",
                    isSidebarExpanded ? "w-full gap-3 px-3" : "w-11 justify-center"
                  )}
                  style={{ borderColor: pathname === `/profile/${user.username}` ? "var(--foreground)" : "transparent" }}
                >
                  <Avatar src={user.avatarUrl} alt={user.name} fallback={user.name} size={24} />
                  {isSidebarExpanded && <span className="uppercase tracking-wide text-xs">Profil</span>}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={() => router.push(`/profile/${user.username}`)}>
                  <Avatar src={user.avatarUrl} alt={user.name} fallback={user.name} size={16} />
                  <span>Profilim</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                  <Settings className="h-4 w-4" />
                  <span>Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/saved")}>
                  <Bookmark className="h-4 w-4" />
                  <span>Kaydedilenler</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>Görünümü değiştir</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      <div
        className={cn(
          "flex flex-col min-w-0 transition-[margin] duration-200",
          isSidebarExpanded ? "md:ml-[220px]" : "md:ml-[68px]"
        )}
      >
        <header className="sticky top-0 z-30 flex items-center h-14 border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-6 w-6" strokeWidth={2.25} />
                  <span className="sr-only">Navigasyon menüsünü aç/kapa</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <Link href="/home" className="flex items-center gap-2 text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                  <Flame className="h-6 w-6" strokeWidth={2.25} />
                  <span>TrendAI</span>
                </Link>
                <nav className="grid gap-1 text-base font-medium">
                  {navLinks.map((link) => {
                    const count = link.badgeKey ? badgeCounts[link.badgeKey] : 0;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground",
                          pathname === link.href && "border-foreground text-foreground"
                        )}
                      >
                        <span className="relative shrink-0">
                          <link.icon className="h-6 w-6" strokeWidth={2.25} />
                          {count > 0 && (
                            <span
                              className="absolute flex h-4 items-center justify-center px-1 font-semibold"
                              style={{
                                top: "-6px",
                                right: "-6px",
                                minWidth: "16px",
                                fontSize: "10px",
                                backgroundColor: "var(--accent)",
                                color: "var(--accent-foreground)",
                              }}
                            >
                              {count > 9 ? "9+" : count}
                            </span>
                          )}
                        </span>
                        <span className="uppercase tracking-wide text-xs">{link.label}</span>
                      </Link>
                    );
                  })}
                  {isGuest ? (
                    <Link
                      href="/login"
                      className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                      <LogIn className="h-6 w-6" strokeWidth={2.25} />
                      <span className="uppercase tracking-wide text-xs">Giriş Yap</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/settings/profile"
                        className={cn(
                          "flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground",
                          pathname.startsWith("/settings") && "border-foreground text-foreground"
                        )}
                      >
                        <Settings className="h-6 w-6" strokeWidth={2.25} />
                        <span className="uppercase tracking-wide text-xs">Ayarlar</span>
                      </Link>
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <Avatar src={user.avatarUrl} alt={user.name} fallback={user.name} size={20} />
                        <span className="uppercase tracking-wide text-xs">Profil</span>
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
