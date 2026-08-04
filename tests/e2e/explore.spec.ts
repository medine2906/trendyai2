import { test, expect } from "@playwright/test";
import { uniqueTestUser, createTestUser, loginViaUI, deleteTestUser } from "./helpers";

test.describe("Keşfet sayfası", () => {
  let user: ReturnType<typeof uniqueTestUser>;

  test.beforeEach(async ({ page }) => {
    user = uniqueTestUser("explore");
    await createTestUser(user);
    await loginViaUI(page, user);
  });

  test.afterEach(async () => {
    await deleteTestUser(user.email);
  });

  test("ürün kataloğu (seed edilmiş test ürünleri) grid'de görünüyor", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: "Keşfet" })).toBeVisible();
    await expect(page.getByAltText("Test Kadın Pamuklu Tişört")).toBeVisible();
    await expect(page.getByAltText("Test Erkek Kışlık Mont")).toBeVisible();
  });

  test("bir ürüne tıklayınca detay feed'i (modal) açılıyor", async ({ page }) => {
    await page.goto("/explore");
    await page.getByAltText("Test Kadın Pamuklu Tişört").first().click();
    await expect(page.getByRole("button", { name: "Kapat", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sepete Ekle" }).first()).toBeVisible();
  });
});
