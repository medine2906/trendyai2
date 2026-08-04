// Amazon.com.tr'nin herkese açık arama sonuçlarından gerçek ürün verisi çeker
// (ad, TL fiyatı, görsel, ürün sayfası linki). Bot koruması yok, plain fetch+cheerio yeterli.
import { scrapeCheerioCategories, type CheerioParsedItem } from "../scrape-cheerio";
import { CATEGORIES } from "../categories";
import type { SourceAdapter } from "../types";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "tr-TR,tr;q=0.9",
};

const MAX_PAGES_PER_QUERY = 4;

function parsePrice(whole: string, fraction: string): number | null {
  const cleanWhole = whole.replace(/[.,\s]/g, "");
  const cleanFraction = (fraction || "00").replace(/\D/g, "").padEnd(2, "0").slice(0, 2);
  const n = parseFloat(`${cleanWhole}.${cleanFraction}`);
  return isNaN(n) ? null : n;
}

export const amazonAdapter: SourceAdapter = {
  id: "Amazon",
  idPrefix: "amzn",
  sourceType: "scrape-cheerio",
  async fetchAll() {
    return scrapeCheerioCategories({
      categories: CATEGORIES,
      maxPagesPerQuery: MAX_PAGES_PER_QUERY,
      headers: HEADERS,
      buildUrl: (query, page) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(query)}&page=${page}`,
      parsePage: ($) => {
        const items: CheerioParsedItem[] = [];
        $("div[data-asin]").each((_, el) => {
          const $el = $(el);
          const asin = $el.attr("data-asin");
          if (!asin) return;

          const img = $el.find("img.s-image").first();
          const name = img.attr("alt")?.trim();
          const rawImageUrl = img.attr("src");
          const imageUrl = rawImageUrl?.replace(/\._[A-Z]{2}_[A-Z0-9,]+_\.jpg$/, "._AC_SL1500_.jpg");
          const relLink = img.closest("a").attr("href");
          const priceWhole = $el.find(".a-price .a-price-whole").first().text().trim();
          const priceFraction = $el.find(".a-price .a-price-fraction").first().text().trim();
          const price = priceWhole ? parsePrice(priceWhole, priceFraction) : null;

          if (!name || !price || !imageUrl || !relLink) return;

          items.push({
            sourceId: asin,
            name,
            price,
            imageUrl,
            sourceUrl: `https://www.amazon.com.tr${relLink.split("?")[0]}`,
          });
        });
        return items;
      },
      onQueryStart: (query, category) => console.log(`"${query}" (${category}) aranıyor... [Amazon]`),
      onQueryDone: (_q, _c, count) => console.log(`  -> ${count} ürün bulundu`),
      onPageWarning: (query, page, reason) =>
        console.warn(`  [uyarı] "${query}" sayfa ${page} için ${reason}, durduruluyor`),
    });
  },
};
