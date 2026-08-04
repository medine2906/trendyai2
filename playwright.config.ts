import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3100";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // next dev sadece proje dizini başına tek bir instance'a izin veriyor (kilit dosyası),
    // yani kullanıcının kendi "npm run dev" (port 3000) süreci çalışırken burada da
    // "next dev" başlatmaya çalışmak "Another next dev server is already running" hatası
    // verir. Bunu tamamen atlamak için testler ayrı bir production build+start kullanır —
    // bu, ikinci bir dev server çakışmasını engeller ve daha kararlı/hızlı bir test çalıştırması sağlar.
    command: `next build --webpack && next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
