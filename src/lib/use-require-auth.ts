"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Misafir (giriş yapmamış) kullanıcı beğenme/kaydetme/takip/mesajlaşma gibi
 * hesaba bağlı bir eylem denediğinde, geri döneceği sayfayı callbackUrl
 * olarak taşıyarak /login'e yönlendirir. Sayfa gezinmesi/ürün görüntüleme
 * bundan etkilenmez — sadece etkileşim anında devreye girer.
 */
export function useRequireAuth() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthed = !!session?.user;

  function requireAuth() {
    if (!isAuthed) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return false;
    }
    return true;
  }

  return { isAuthed, requireAuth };
}
