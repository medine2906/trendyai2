// Trendyol'un arama sonuçlarından gerçek ürün verisi çeker. Trendyol Cloudflare bot koruması
// kullandığı için plain fetch/cheerio 403 dönüyor — bu yüzden Playwright/Chromium kullanılıyor.
import { scrapePlaywrightCategories, type PlaywrightParsedItem } from "../scrape-playwright";
import { CATEGORIES } from "../categories";
import type { SourceAdapter } from "../types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const MAX_PAGES_PER_QUERY = 2;

function parsePrice(text: string): number | null {
  // "648 TL" veya "3.263,25 TL" -> 648 / 3263.25
  const cleaned = text.replace(/TL/i, "").trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export const trendyolAdapter: SourceAdapter = {
  id: "Trendyol",
  idPrefix: "tyol",
  sourceType: "scrape-playwright",
  async fetchAll() {
    const categories = process.env.TY_SMOKE_TEST ? CATEGORIES.slice(0, 2) : CATEGORIES;

    return scrapePlaywrightCategories({
      categories,
      maxPagesPerQuery: MAX_PAGES_PER_QUERY,
      userAgent: USER_AGENT,
      buildUrl: (query, page) => `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}&pi=${page}`,
      extractPage: async (page) => {
        const raw = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll("a.product-card"));
          return cards.map((card) => {
            const img = card.querySelector("img.image") as HTMLImageElement | null;
            const priceEl = card.querySelector("[data-testid='price-value']");
            return {
              id: card.getAttribute("id"),
              href: card.getAttribute("href"),
              name: img?.getAttribute("alt") || null,
              imageUrl: img?.getAttribute("src") || null,
              priceText: priceEl?.textContent || null,
            };
          });
        });

        const items: PlaywrightParsedItem[] = [];
        for (const item of raw) {
          if (!item.id || !item.name || !item.href || !item.imageUrl || !item.priceText) continue;
          const price = parsePrice(item.priceText);
          if (!price) continue;
          items.push({
            sourceId: item.id,
            name: item.name,
            price,
            imageUrl: item.imageUrl,
            sourceUrl: `https://www.trendyol.com${item.href.split("?")[0]}`,
          });
        }
        return items;
      },
      onQueryStart: (query, category) => console.log(`"${query}" (${category}) aranıyor... [Trendyol]`),
      onQueryDone: (_q, _c, count) => console.log(`  -> ${count} ürün bulundu`),
      onPageWarning: (query, page, reason, error) =>
        console.warn(`  [uyarı] "${query}" sayfa ${page} ${reason}, durduruluyor`, error ?? ""),
    });
  },
};
