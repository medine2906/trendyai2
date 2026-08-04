import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const WaitlistSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
});

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`waitlist:${clientIp(request)}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yaptınız, lütfen daha sonra tekrar deneyin" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 0) / 1000)) } }
    );
  }

  const body = await request.json();
  const parsed = WaitlistSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz e-posta" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  const existing = await db.waitlistEmail.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu e-posta zaten listede." },
      { status: 409 }
    );
  }

  await db.waitlistEmail.create({ data: { email } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
