// Ürünleri Groq LLM ile etiketler: kumaş (fabric), mevsim (season), arama
// eşleştirmesini güçlendiren anahtar kelimeler (tags) ve kısa bir ürün özeti
// (aiSummary) üretir. GROQ_API_KEY yoksa (veya bir ürün için LLM çağrısı
// başarısız olursa) eski regex/anahtar-kelime tabanlı sınıflandırmaya düşer,
// yani script hiçbir zaman ürünü etiketsiz bırakmaz.
// Çalıştırma: npx tsx prisma/classify-products.ts
// Sadece yeni/etiketlenmemiş ürünleri LLM'e gönderir (aiSummary boş olanlar) —
// her 6 saatlik refresh'te binlerce değişmemiş ürünü tekrar LLM'e göndermemek
// için. Tüm katalogu zorla yeniden etiketlemek için FORCE_RECLASSIFY=1 kullan.
import { PrismaClient, type Product } from "@prisma/client";
import Groq from "groq-sdk";

const db = new PrismaClient();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const BATCH_SIZE = 15;
const DELAY_MS = 2200;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Regex tabanlı yedek sınıflandırma (LLM yoksa/başarısızsa kullanılır) ---

const FABRIC_PATTERNS: { pattern: RegExp; fabric: string }[] = [
  { pattern: /keten/i, fabric: "Keten" },
  { pattern: /kadife/i, fabric: "Kadife" },
  { pattern: /y[uü]n/i, fabric: "Yün" },
  { pattern: /deri/i, fabric: "Deri" },
  { pattern: /denim|jean/i, fabric: "Denim" },
  { pattern: /gabardin/i, fabric: "Gabardin" },
  { pattern: /viskon/i, fabric: "Viskon" },
  { pattern: /polyester/i, fabric: "Polyester" },
  { pattern: /pamuk/i, fabric: "Pamuk" },
];

const WARM_FABRICS = new Set(["Yün", "Kadife", "Deri"]);
const COOL_FABRICS = new Set(["Pamuk", "Keten", "Viskon"]);
const WARM_CATEGORIES = new Set(["Kazak", "Ceket"]);
const COOL_CATEGORIES = new Set(["Tişört", "Elbise"]);

const SILHOUETTE_PATTERNS: { pattern: RegExp; tag: string }[] = [
  { pattern: /kalem\s*(elbise|etek|kesim)?/i, tag: "kalem kesim" },
  { pattern: /dar\s*kesim|vücuda oturan|body\b/i, tag: "dar kesim" },
  { pattern: /sala[şs]|bol kesim|oversize/i, tag: "salaş" },
  { pattern: /pileli|volanl[ıi]/i, tag: "pileli" },
  { pattern: /şifon|organze/i, tag: "şifon" },
  { pattern: /likra|strec|streç|elastan/i, tag: "streç" },
  { pattern: /\bmini\b/i, tag: "mini" },
  { pattern: /\bmidi\b/i, tag: "midi" },
  { pattern: /\bmaxi\b|uzun elbise/i, tag: "maxi" },
];

function detectFabric(haystack: string): string | null {
  for (const { pattern, fabric } of FABRIC_PATTERNS) {
    if (pattern.test(haystack)) return fabric;
  }
  return null;
}

function detectSilhouetteTags(haystack: string): string[] {
  return SILHOUETTE_PATTERNS.filter(({ pattern }) => pattern.test(haystack)).map(({ tag }) => tag);
}

function regexClassify(name: string, description: string, category: string, existingTags: string) {
  const haystack = `${name} ${description}`;
  const fabric = detectFabric(haystack);

  let warmth: "warm" | "cool" | "neutral";
  if (fabric && WARM_FABRICS.has(fabric)) warmth = "warm";
  else if (fabric && COOL_FABRICS.has(fabric)) warmth = "cool";
  else if (WARM_CATEGORIES.has(category)) warmth = "warm";
  else if (COOL_CATEGORIES.has(category)) warmth = "cool";
  else warmth = "neutral";

  const season = warmth === "warm" ? "Kış" : warmth === "cool" ? "Yaz" : "Dört Mevsim";

  const extraTags =
    warmth === "warm"
      ? ["sıcak tutar", "kalın", "kışlık", "az nefes alır"]
      : warmth === "cool"
        ? ["serin tutar", "nefes alan", "terletmeyen", "hafif", "yazlık"]
        : ["dört mevsim", "orta kalınlık"];
  extraTags.push(...detectSilhouetteTags(haystack));

  return { fabric, season, tags: mergeTags(existingTags, extraTags), aiSummary: null as string | null };
}

function mergeTags(existingTags: string, extraTags: string[]): string {
  const existing = new Set(
    existingTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
  );
  const merged = [...existing];
  for (const tag of extraTags) {
    if (!existing.has(tag.toLowerCase())) merged.push(tag);
  }
  return merged.join(",");
}

// --- LLM tabanlı sınıflandırma ---

interface LlmClassification {
  id: string;
  fabric: string | null;
  season: "Yaz" | "Kış" | "Dört Mevsim";
  tags: string[];
  aiSummary: string;
}

async function classifyBatchWithLlm(
  products: Product[],
  attempt = 1
): Promise<Map<string, LlmClassification>> {
  const result = new Map<string, LlmClassification>();
  if (!groq) return result;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sen bir moda kataloğu etiketleme uzmanısın. Sana ürün adı/açıklama/kategori içeren bir liste " +
            "verilecek. Her ürün için: (1) fabric — baskın kumaş (örn. Pamuk, Keten, Yün, Kadife, Deri, Denim, " +
            "Polyester, Viskon, Gabardin) belirlenemiyorsa null; (2) season — 'Yaz', 'Kış' veya 'Dört Mevsim' " +
            "(kumaş/kalınlık/kategoriye göre); (3) tags — Türkçe, virgülsüz kısa anahtar kelimelerden oluşan bir " +
            "dizi: sıcaklık hissi (örn. 'serin tutar', 'nefes alan', 'sıcak tutar', 'kalın'), kesim/silüet (örn. " +
            "'dar kesim', 'salaş', 'kalem kesim', 'mini', 'midi', 'maxi', 'pileli'), varsa stil/kullanım alanı " +
            "(örn. 'günlük', 'şık', 'spor', 'ofis'); (4) aiSummary — ürünü tek kısa cümleyle Türkçe özetleyen bir " +
            "açıklama (arama sonuçlarında gösterilecek). " +
            'Yanıtını JSON formatında, şu şemayla ver: {"results": [{"id": string, "fabric": string|null, "season": string, ' +
            '"tags": string[], "aiSummary": string}]}. Girdi listesindeki HER ürün için tam olarak bir sonuç ' +
            "üret, id'leri değiştirme.",
        },
        {
          role: "user",
          content: JSON.stringify(
            products.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              category: p.category,
            }))
          ),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return result;

    const parsed = JSON.parse(raw) as { results?: LlmClassification[] };
    for (const entry of parsed.results ?? []) {
      if (entry.id) result.set(entry.id, entry);
    }
  } catch (error) {
    const isRateLimit = error instanceof Groq.APIError && error.status === 429;
    if (isRateLimit && attempt <= MAX_RETRIES) {
      const backoffMs = DELAY_MS * 2 ** attempt;
      console.warn(`Rate limit'e takıldı, ${backoffMs}ms bekleyip tekrar denenecek (deneme ${attempt}/${MAX_RETRIES})...`);
      await sleep(backoffMs);
      return classifyBatchWithLlm(products, attempt + 1);
    }
    console.error("LLM sınıflandırma çağrısı başarısız oldu (bu grup regex'e düşecek):", error);
  }

  return result;
}

async function main() {
  const forceReclassify = process.env.FORCE_RECLASSIFY === "1";
  const allProducts = await db.product.findMany();
  const products = forceReclassify ? allProducts : allProducts.filter((p) => !p.aiSummary);

  console.log(
    `${allProducts.length} ürün mevcut, ${products.length} tanesi ${
      groq ? "LLM ile" : "regex ile (GROQ_API_KEY yok)"
    } etiketlenecek...`
  );

  let updated = 0;
  let llmCount = 0;
  let regexFallbackCount = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const llmResults = groq ? await classifyBatchWithLlm(batch) : new Map<string, LlmClassification>();

    for (const p of batch) {
      const llm = llmResults.get(p.id);
      if (llm) {
        await db.product.update({
          where: { id: p.id },
          data: {
            fabric: llm.fabric,
            season: llm.season,
            tags: mergeTags(p.tags, llm.tags ?? []),
            aiSummary: llm.aiSummary || null,
          },
        });
        llmCount++;
      } else {
        const { fabric, season, tags } = regexClassify(p.name, p.description, p.category, p.tags);
        await db.product.update({
          where: { id: p.id },
          data: { fabric, season, tags },
        });
        regexFallbackCount++;
      }
      updated++;
    }

    if (groq && i + BATCH_SIZE < products.length) await sleep(DELAY_MS);
  }

  console.log(
    `Tamamlandı: ${updated} ürün güncellendi (${llmCount} LLM ile, ${regexFallbackCount} regex yedeğiyle). ` +
      `${allProducts.length - products.length} ürün zaten etiketliydi, atlandı.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
