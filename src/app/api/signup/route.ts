import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const SignupSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalı")
    .regex(/^[a-z0-9_.]+$/, "Kullanıcı adı sadece küçük harf, rakam, . ve _ içerebilir"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[a-zA-Z]/, "Şifre en az bir harf içermeli")
    .regex(/[0-9]/, "Şifre en az bir rakam içermeli"),
});

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(`signup:${clientIp(request)}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yaptınız, lütfen daha sonra tekrar deneyin" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 0) / 1000)) } }
    );
  }

  const body = await request.json();
  const parsed = SignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi" },
      { status: 400 }
    );
  }

  const { name, username, email, password } = parsed.data;

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Bu e-posta veya kullanıcı adı zaten kullanımda" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, username, email, passwordHash },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
