import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchProducts, describeImage, groqEnabled } from "@/lib/groq";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  // AI arama misafir kullanıcıya da açık — sadece hesaba özel işlemler
  // (satın alma vb.) giriş ister. Kimliksiz istekler IP bazlı sınırlanır.
  const rateLimitKey = session?.user?.id ? `chat:${session.user.id}` : `chat:ip:${clientIp(request)}`;
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 20, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla arama yaptınız, birkaç dakika sonra tekrar deneyin" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 0) / 1000)) } }
    );
  }

  const { query, history, image } = (await request.json()) as {
    query?: string;
    history?: { role: "user" | "assistant"; content: string }[];
    image?: string;
  };
  const trimmedQuery = query?.trim() ?? "";
  if (!trimmedQuery && !image) {
    return NextResponse.json({ error: "Sorgu boş olamaz" }, { status: 400 });
  }

  let effectiveQuery = trimmedQuery;
  let historyLabel = trimmedQuery;

  if (image) {
    if (!groqEnabled) {
      return NextResponse.json({
        products: [],
        explanation:
          "Fotoğrafla arama için AI özelliğinin aktif olması gerekiyor. Şimdilik yazarak arayabilirsin.",
      });
    }
    const description = await describeImage(image);
    effectiveQuery = [trimmedQuery, description ? `Fotoğraftaki ürün: ${description}` : ""]
      .filter(Boolean)
      .join(". ") || "Fotoğraftaki kıyafete benzer ürünler";
    historyLabel = `[Fotoğraf] ${effectiveQuery}`;
  }

  const result = await searchProducts(effectiveQuery, history ?? [], session?.user?.name ?? undefined);

  if (!result.clarify && session?.user?.id) {
    await db.searchHistory.create({
      data: { userId: session.user.id, query: historyLabel },
    });
  }

  return NextResponse.json(result);
}
