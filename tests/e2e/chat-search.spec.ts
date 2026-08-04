import { test, expect } from "@playwright/test";
import { uniqueTestUser, createTestUser, loginViaUI, deleteTestUser } from "./helpers";

// GROQ_API_KEY .env.test'te bilinçli olarak boş bırakıldı, bu yüzden /api/chat
// deterministik keyword-fallback moduna düşer (bkz. src/lib/groq.ts). Bu testler
// seed edilmiş test ürünlerinin (tests/setup/seed-test-db.ts) etiketleriyle eşleşen
// kelimeler kullanır.

test.describe("AI arama (chat)", () => {
  let user: ReturnType<typeof uniqueTestUser>;

  test.beforeEach(async ({ page }) => {
    user = uniqueTestUser("chat");
    await createTestUser(user);
    await loginViaUI(page, user);
    await page.goto("/chat");
  });

  test.afterEach(async () => {
    await deleteTestUser(user.email);
  });

  test("bir sorgu yazıp ilgili ürünü sonuçlarda görebiliyor", async ({ page }) => {
    await page.getByPlaceholder("Ne arıyorsun?").fill("kadın için yazlık pamuklu tişört arıyorum");
    await page.keyboard.press("Enter");

    await expect(page.getByText("Test Kadın Pamuklu Tişört")).toBeVisible({ timeout: 15_000 });
  });

  test("arama geçmişine kaydediliyor", async ({ page }) => {
    await page.getByPlaceholder("Ne arıyorsun?").fill("erkek için kışlık mont arıyorum");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Test Erkek Kışlık Mont")).toBeVisible({ timeout: 15_000 });

    await page.goto("/history");
    await expect(page.getByText("erkek için kışlık mont arıyorum")).toBeVisible();
  });
});
