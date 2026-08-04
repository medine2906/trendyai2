// Tüm ürün kaynağı adapter'larının (feed/scrape-cheerio/scrape-playwright) uyduğu ortak arayüz.
// Yeni bir site eklemek, bu arayüze uyan tek bir dosya yazmaktan ibaret olmalı.

export interface CategoryQuery {
  query: string;
  category: string;
  take: number;
}

export interface RawProduct {
  sourceId: string; // sitedeki ham ürün kimliği (asin, trendyol id, feed sku vb.)
  name: string;
  price: number;
  imageUrl: string;
  sourceUrl: string;
  category: string;
  tags: string;
  rawDescription?: string; // description'dan daha uzun/ham açıklama-özellik metni (classify-products.ts'e beslenir)
  specifications?: Record<string, string>; // kaynaktan gelen ham yapılandırılmış özellik verisi
}

export type SourceType = "feed" | "scrape-cheerio" | "scrape-playwright";

export interface SourceAdapter {
  id: string; // "Amazon" | "Trendyol" | ... — Product.sourceSite alanına yazılır
  idPrefix: string; // "amzn" | "tyol" | ... — Product.id = `${idPrefix}-${sourceId}`
  sourceType: SourceType;
  fetchAll(): Promise<RawProduct[]>;
}
