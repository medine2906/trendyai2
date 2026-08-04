import { test, expect } from "@playwright/test";
import { uniqueTestUser, signup, deleteTestUser } from "./helpers";

test.describe("Kayıt ve giriş akışı", () => {
  test("yeni kullanıcı kayıt olup ana sayfaya yönlendiriliyor", async ({ page }) => {
    const user = uniqueTestUser("auth");
    try {
      await signup(page, user);
      await expect(page).toHaveURL(/\/home/);
    } finally {
      await deleteTestUser(user.email);
    }
  });

  test("kayıtlı kullanıcı çıkış yapıp aynı bilgilerle tekrar giriş yapabiliyor", async ({ page }) => {
    const user = uniqueTestUser("relogin");
    try {
      await signup(page, user);
      await expect(page).toHaveURL(/\/home/);

      await page.context().clearCookies();
      await page.goto("/login");
      await page.getByPlaceholder("E-posta").fill(user.email);
      await page.getByPlaceholder("Şifre").fill(user.password);
      await page.getByRole("button", { name: "Giriş Yap", exact: true }).click();
      await page.waitForURL("**/home", { timeout: 15_000 });
      await expect(page).toHaveURL(/\/home/);
    } finally {
      await deleteTestUser(user.email);
    }
  });

  test("yanlış şifreyle giriş reddediliyor", async ({ page }) => {
    const user = uniqueTestUser("badpw");
    try {
      await signup(page, user);
      await page.context().clearCookies();
      await page.goto("/login");
      await page.getByPlaceholder("E-posta").fill(user.email);
      await page.getByPlaceholder("Şifre").fill("yanlis-sifre");
      await page.getByRole("button", { name: "Giriş Yap", exact: true }).click();
      await expect(page.getByText("E-posta veya şifre hatalı.")).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await deleteTestUser(user.email);
    }
  });

  test("oturum açmadan korumalı bir sayfaya gidince login'e yönlendiriliyor", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });
});
