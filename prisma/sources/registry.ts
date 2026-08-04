import { amazonAdapter } from "./adapters/amazon";
import { trendyolAdapter } from "./adapters/trendyol";
import type { SourceAdapter } from "./types";

// Aktif kaynak adapter'ları. Yeni bir site eklemek için `adapters/` altına bir dosya yazıp
// burada listeye ekle — upsert/stale-delete/dedup mantığını run.ts zaten hepsi için ortak yönetiyor.
export const SOURCE_ADAPTERS: SourceAdapter[] = [amazonAdapter, trendyolAdapter];
