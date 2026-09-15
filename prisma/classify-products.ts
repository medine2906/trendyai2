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

// Kesim/silüet etiketinden, sohbette sık sorulan fiziksel/bağlamsal kullanım
// senaryolarına (rüzgar, hareket kolaylığı vb.) dair ek etiketler türetir.
const CONTEXT_TAGS_BY_SILHOUETTE: Record<string, string[]> = {
  salaş: ["rüzgarda uçuşabilir"],
  pileli: ["rüzgarda uçuşabilir"],
  şifon: ["rüzgarda uçuşabilir", "yağmurda ıslanır"],
  "dar kesim": ["rüzgarda uçuşmaz"],
  streç: ["hareket serbestliği sağlar", "rüzgarda uçuşmaz"],
};

function detectSilhouetteTags(haystack: string): string[] {
  const silhouetteTags = SILHOUETTE_PATTERNS.filter(({ pattern }) => pattern.test(haystack)).map(
    ({ tag }) => tag
  );
  const contextTags = silhouetteTags.flatMap((tag) => CONTEXT_TAGS_BY_SILHOUETTE[tag] ?? []);
  return [...silhouetteTags, ...contextTags];
}

function regexClassify(
  name: string,
  description: string,
  category: string,
  existingTags: string,
  rawDescription?: string | null
) {
  const haystack = `${name} ${description} ${rawDescription ?? ""}`;
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
            "Sen bir ürün kataloğu etiketleme uzmanısın. Sana ürün adı/açıklama/kategori (varsa ham kaynak " +
            "açıklaması `rawDescription` ve kaynak sitenin yapılandırılmış özellik verisi `specifications`) " +
            "içeren bir liste verilecek. Bu ürünler SADECE giyim olmayabilir (elektronik, ev eşyası, aksesuar " +
            "vb. de olabilir) — etiketleri ürünün gerçek kategorisine göre uydur, giyime özgü etiketleri " +
            "giyim dışı ürünlere zorlama. Her ürün için: " +
            "(1) fabric — giyimse baskın kumaş (örn. Pamuk, Keten, Yün, Kadife, Deri, Denim, Polyester, Viskon, " +
            "Gabardin), giyim değilse veya belirlenemiyorsa null; " +
            "(2) season — giyimse 'Yaz'/'Kış'/'Dört Mevsim', giyim dışı ürünlerde de mevsimsel bir kullanım " +
            "öne çıkıyorsa (örn. klima, mont) uygula, yoksa 'Dört Mevsim'; " +
            "(3) tags — Türkçe, virgülsüz kısa anahtar kelimelerden oluşan bir dizi. Şu kategorilerden ÜRÜNE " +
            "uyanları ekle: sıcaklık hissi ('serin tutar', 'nefes alan', 'sıcak tutar', 'kalın'), kesim/silüet " +
            "('dar kesim', 'salaş', 'kalem kesim', 'mini', 'midi', 'maxi', 'pileli'), stil/kullanım alanı " +
            "('günlük', 'şık', 'spor', 'ofis'), ve ÖNEMLİ — kullanıcıların sohbette sorduğu FİZİKSEL/BAĞLAMSAL " +
            "kullanım senaryolarını karşılayan etiketler: hava koşulu uygunluğu (geniş/uçuşan etek/elbise ise " +
            "'rüzgarda uçuşabilir', dar/oturan kesimse 'rüzgarda uçuşmaz', su geçirmez/suya dayanıklı kumaş/ürünse " +
            "'suya dayanıklı', ince/şeffaf kumaşsa 'yağmurda ıslanır'), hareket kolaylığı (streç/esnek kumaş ya " +
            "da spor kesimse 'hareket serbestliği sağlar', dar/sert kesimse 'hareketi kısıtlar'), konfor/dayanıklılık " +
            "(varsa 'uzun süre ayakta durmaya uygun', 'seyahate uygun', 'hafif ve taşınabilir' gibi ürüne özgü " +
            "somut gerekçeler). Uydurma/genel geçer etiket ekleme — sadece ürünün adı/açıklamasından gerçekten " +
            "çıkarsanabilen somut özellikleri etiketle; emin değilsen o etiketi atla. " +
            "(4) aiSummary — ürünü tek kısa cümleyle Türkçe özetleyen bir açıklama (arama sonuçlarında " +
            "gösterilecek). " +
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
              ...(p.rawDescription ? { rawDescription: p.rawDescription } : {}),
              ...(p.specifications ? { specifications: p.specifications } : {}),
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
        const { fabric, season, tags } = regexClassify(
          p.name,
          p.description,
          p.category,
          p.tags,
          p.rawDescription
        );
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
