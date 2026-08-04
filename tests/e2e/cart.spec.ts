import { test, expect } from "@playwright/test";
import { uniqueTestUser, signup, deleteTestUser } from "./helpers";

test.describe("Sepet akışı", () => {
  let user: ReturnType<typeof uniqueTestUser>;

  test.beforeEach(async ({ page }) => {
    user = uniqueTestUser("cart");
    await signup(page, user);
  });

  test.afterEach(async () => {
    await deleteTestUser(user.email);
  });

  test("ürün sayfasından sepete eklenip sepette görünüyor", async ({ page }) => {
    await page.goto("/product/test-prod-tshirt");
    await expect(page.getByRole("heading", { name: "Test Kadın Pamuklu Tişört" })).toBeVisible();

    await page.getByRole("button", { name: "Sepete Ekle" }).click();
    await expect(page.getByRole("button", { name: "Sepete Eklendi" })).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText("Test Kadın Pamuklu Tişört")).toBeVisible();
    await expect(page.getByText("Sepetiniz boş.")).not.toBeVisible();
  });

  test("boş sepet 'Sepetiniz boş.' mesajı gösteriyor", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText("Sepetiniz boş.")).toBeVisible();
  });
});
