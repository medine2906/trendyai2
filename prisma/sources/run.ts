// Tüm aktif kaynak adapter'larını (registry.ts) sırayla çalıştırır, ürünleri Product tablosuna
// upsert eder ve her kaynak için o turda görülmeyen eski ürünleri temizler. Amazon/Trendyol
// script'lerinde tekrarlanan upsert/stale-delete mantığının tek, ortak yeri burasıdır.
//
// Çalıştırma: npx tsx prisma/sources/run.ts
import { PrismaClient } from "@prisma/client";
import { SOURCE_ADAPTERS } from "./registry";
import type { RawProduct, SourceAdapter } from "./types";

const db = new PrismaClient();

async function runAdapter(adapter: SourceAdapter): Promise<{ total: number; stale: number }> {
  console.log(`\n=== ${adapter.id} kaynağından ürün çekiliyor (${adapter.sourceType}) ===`);
  const products: RawProduct[] = await adapter.fetchAll();

  let total = 0;
  const seenIds = new Set<string>();

  for (const p of products) {
    const id = `${adapter.idPrefix}-${p.sourceId}`;
    seenIds.add(id);
    await db.product.upsert({
      where: { id },
      update: {
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        sourceUrl: p.sourceUrl,
        category: p.category,
        tags: p.tags,
        sourceType: adapter.sourceType,
        ...(p.rawDescription ? { rawDescription: p.rawDescription } : {}),
        ...(p.specifications ? { specifications: p.specifications } : {}),
      },
      create: {
        id,
        name: p.name,
        description: p.name,
        category: p.category,
        price: p.price,
        imageUrl: p.imageUrl,
        tags: p.tags,
        sourceSite: adapter.id,
        sourceUrl: p.sourceUrl,
        sourceType: adapter.sourceType,
        rawDescription: p.rawDescription,
        specifications: p.specifications,
      },
    });
    total += 1;
  }

  if (total === 0) {
    // Adaptör hiç ürün döndürmediyse (site geçici olarak engelliyor/503 veriyor, markup değişti vb.)
    // bunu "artık hiç ürün yok" sanıp tüm kaynağı silmek çok tehlikeli — sessizce atla, sadece uyar.
    console.warn(
      `[uyarı] ${adapter.id} hiç ürün döndürmedi — kaynak muhtemelen engellendi/başarısız oldu. ` +
        `Eski ürünleri SİLMİYORUM (yanlışlıkla tüm kataloğu boşaltmamak için).`
    );
    return { total: 0, stale: 0 };
  }

  const stale = await db.product.deleteMany({
    where: { sourceSite: adapter.id, id: { notIn: Array.from(seenIds) } },
  });

  console.log(`${adapter.id}: ${total} ürün kaydedildi/güncellendi, ${stale.count} eski ürün temizlendi.`);
  return { total, stale: stale.count };
}

async function main() {
  console.log(`${SOURCE_ADAPTERS.length} kaynak adapter'ı çalıştırılacak: ${SOURCE_ADAPTERS.map((a) => a.id).join(", ")}`);

  let grandTotal = 0;
  let grandStale = 0;

  for (const adapter of SOURCE_ADAPTERS) {
    try {
      const { total, stale } = await runAdapter(adapter);
      grandTotal += total;
      grandStale += stale;
    } catch (e) {
      console.error(`[hata] ${adapter.id} adapter'ı başarısız oldu, diğer kaynaklarla devam ediliyor:`, e);
    }
  }

  console.log(`\nTamamlandı: toplam ${grandTotal} ürün kaydedildi/güncellendi, ${grandStale} eski ürün temizlendi.`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
