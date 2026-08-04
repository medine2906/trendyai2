import type { Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import { db } from "../../src/lib/db";

export function uniqueTestUser(tag: string) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    name: `Otomasyon ${tag}`,
    username: `otom_${tag}_${suffix}`.toLowerCase().slice(0, 30),
    email: `otom-${tag}-${suffix}@example.com`,
    password: "guvenli-e2e-sifresi-123",
  };
}

// /api/signup IP başına 15 dakikada 5 istekle sınırlı (bkz. src/app/api/signup/route.ts) —
// tüm test dosyaları aynı localhost IP'sini paylaştığından her testin gerçek signup formunu
// kullanması bu limiti hemen doldurur. Bu yüzden sadece signup akışını doğrudan test eden
// test signup()'ı (gerçek formu) kullanır; oturum açmış bir kullanıcıya ihtiyaç duyan diğer
// tüm testler bunun yerine kullanıcıyı doğrudan DB'ye yazan createTestUser() + loginViaUI()
// kullanır.
export async function signup(page: Page, user: ReturnType<typeof uniqueTestUser>) {
  await page.goto("/signup");
  // Next dev'de ilk ziyarette sayfa henüz hydrate olmadan submit edilirse form
  // native GET submission'a düşüp React'in preventDefault'unu atlıyor — hydration
  // bitene (JS bundle çalışıp networkidle olana) kadar bekle.
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Ad Soyad").fill(user.name);
  await page.getByPlaceholder("Kullanıcı adı").fill(user.username);
  await page.getByPlaceholder("E-posta").fill(user.email);
  await page.getByPlaceholder("Şifre").fill(user.password);
  await page.getByRole("button", { name: "Kayıt Ol" }).click();
  await page.waitForURL("**/home", { timeout: 30_000 });
}

export async function createTestUser(user: ReturnType<typeof uniqueTestUser>) {
  const passwordHash = await bcrypt.hash(user.password, 10);
  await db.user.create({
    data: { name: user.name, username: user.username, email: user.email, passwordHash },
  });
}

export async function loginViaUI(page: Page, user: ReturnType<typeof uniqueTestUser>) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("E-posta").fill(user.email);
  await page.getByPlaceholder("Şifre").fill(user.password);
  await page.getByRole("button", { name: "Giriş Yap", exact: true }).click();
  await page.waitForURL("**/home", { timeout: 30_000 });
}

export async function deleteTestUser(email: string) {
  await db.user.deleteMany({ where: { email } });
}
