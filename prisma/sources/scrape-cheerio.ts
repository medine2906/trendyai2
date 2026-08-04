// Bot koruması olmayan, sunucu tarafında render edilen HTML siteleri için paylaşılan
// fetch+cheerio tarama iskeleti. Site'a özgü olan tek şey URL kurma ve sayfa ayrıştırma —
// sayfalama/dedup/gecikme/tags üretimi burada tek yerde yönetilir.

import * as cheerio from "cheerio";
import type { CategoryQuery, RawProduct } from "./types";

export interface CheerioParsedItem {
  sourceId: string;
  name: string;
  price: number;
  imageUrl: string;
  sourceUrl: string;
  rawDescription?: string;
  specifications?: Record<string, string>;
}

export interface CheerioPageParser {
  ($: cheerio.CheerioAPI, ctx: { query: string; category: string }): CheerioParsedItem[];
}

export interface ScrapeCheerioOptions {
  categories: CategoryQuery[];
  maxPagesPerQuery: number;
  headers: Record<string, string>;
  buildUrl: (query: string, page: number) => string;
  parsePage: CheerioPageParser;
  delayMsBetweenPages?: number;
  delayMsBetweenQueries?: number;
  onQueryStart?: (query: string, category: string) => void;
  onQueryDone?: (query: string, category: string, count: number) => void;
  onPageWarning?: (query: string, page: number, reason: string) => void;
}

export async function scrapeCheerioCategories(opts: ScrapeCheerioOptions): Promise<RawProduct[]> {
  const {
    categories,
    maxPagesPerQuery,
    headers,
    buildUrl,
    parsePage,
    delayMsBetweenPages = 1200,
    delayMsBetweenQueries = 1500,
    onQueryStart,
    onQueryDone,
    onPageWarning,
  } = opts;

  const all: RawProduct[] = [];

  for (const { query, category, take } of categories) {
    onQueryStart?.(query, category);
    const seen = new Set<string>();
    const found: RawProduct[] = [];

    for (let page = 1; page <= maxPagesPerQuery && found.length < take; page += 1) {
      const url = buildUrl(query, page);
      const res = await fetch(url, { headers });
      if (!res.ok) {
        onPageWarning?.(query, page, `HTTP ${res.status}`);
        break;
      }
      const html = await res.text();
      const $ = cheerio.load(html);

      const before = found.length;
      for (const item of parsePage($, { query, category })) {
        if (found.length >= take) break;
        if (seen.has(item.sourceId)) continue;
        seen.add(item.sourceId);
        found.push({
          ...item,
          category,
          tags: `${category.toLowerCase()},${query.toLowerCase().replace(/\s+/g, ",")}`,
        });
      }

      // Bu sayfada hiç yeni ürün bulunamadıysa (son sayfaya gelindi), daha fazla sayfa denemeye gerek yok
      if (found.length === before) break;

      if (page < maxPagesPerQuery && found.length < take) {
        await new Promise((r) => setTimeout(r, delayMsBetweenPages));
      }
    }

    onQueryDone?.(query, category, found.length);
    all.push(...found);
    await new Promise((r) => setTimeout(r, delayMsBetweenQueries));
  }

  return all;
}
