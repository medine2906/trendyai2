// Cloudflare gibi aktif bot koruması olan siteler için paylaşılan Playwright/Chromium
// tarama iskeleti. Site'a özgü olan tek şey URL kurma ve DOM'dan öğe çıkarma (page.evaluate) —
// browser/context yönetimi, sayfalama/dedup/gecikme/tags üretimi burada tek yerde yönetilir.

import { chromium, type Browser, type Page } from "playwright";
import type { CategoryQuery, RawProduct } from "./types";

export interface PlaywrightParsedItem {
  sourceId: string;
  name: string;
  price: number;
  imageUrl: string;
  sourceUrl: string;
  rawDescription?: string;
  specifications?: Record<string, string>;
}

export interface ScrapePlaywrightOptions {
  categories: CategoryQuery[];
  maxPagesPerQuery: number;
  userAgent: string;
  locale?: string;
  viewport?: { width: number; height: number };
  buildUrl: (query: string, page: number) => string;
  extractPage: (page: Page) => Promise<PlaywrightParsedItem[]>;
  navTimeoutMs?: number;
  waitAfterNavMs?: number;
  delayMsBetweenPages?: number;
  delayMsBetweenQueries?: number;
  onQueryStart?: (query: string, category: string) => void;
  onQueryDone?: (query: string, category: string, count: number) => void;
  onPageWarning?: (query: string, page: number, reason: string, error?: unknown) => void;
}

export async function scrapePlaywrightCategories(opts: ScrapePlaywrightOptions): Promise<RawProduct[]> {
  const {
    categories,
    maxPagesPerQuery,
    userAgent,
    locale = "tr-TR",
    viewport = { width: 1366, height: 900 },
    buildUrl,
    extractPage,
    navTimeoutMs = 30000,
    waitAfterNavMs = 2500,
    delayMsBetweenPages = 1500,
    delayMsBetweenQueries = 2000,
    onQueryStart,
    onQueryDone,
    onPageWarning,
  } = opts;

  const browser: Browser = await chromium.launch({ headless: true });
  const all: RawProduct[] = [];

  try {
    for (const { query, category, take } of categories) {
      onQueryStart?.(query, category);
      const context = await browser.newContext({ userAgent, locale, viewport });
      const page = await context.newPage();

      const seen = new Set<string>();
      const found: RawProduct[] = [];

      for (let p = 1; p <= maxPagesPerQuery && found.length < take; p += 1) {
        const url = buildUrl(query, p);
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: navTimeoutMs });
          await page.waitForTimeout(waitAfterNavMs);
        } catch (e) {
          onPageWarning?.(query, p, "sayfa yüklenemedi", e);
          break;
        }

        let items: PlaywrightParsedItem[];
        try {
          items = await extractPage(page);
        } catch (e) {
          onPageWarning?.(query, p, "sayfa okunamadı", e);
          break;
        }

        const before = found.length;
        for (const item of items) {
          if (found.length >= take) break;
          if (seen.has(item.sourceId)) continue;
          seen.add(item.sourceId);
          found.push({
            ...item,
            category,
            tags: `${category.toLowerCase()},${query.toLowerCase().replace(/\s+/g, ",")}`,
          });
        }

        if (found.length === before) break;
        if (p < maxPagesPerQuery && found.length < take) {
          await new Promise((r) => setTimeout(r, delayMsBetweenPages));
        }
      }

      await context.close();
      onQueryDone?.(query, category, found.length);
      all.push(...found);
      await new Promise((r) => setTimeout(r, delayMsBetweenQueries));
    }
  } finally {
    await browser.close();
  }

  return all;
}
