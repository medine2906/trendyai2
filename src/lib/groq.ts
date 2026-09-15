import Groq from "groq-sdk";
import type { Product } from "@prisma/client";
import { db } from "@/lib/db";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export const groqEnabled = !!groq;

// Yüklenen bir fotoğrafı (data URL) Groq'un görsel destekli modeline gönderip
// Türkçe kısa bir ürün tarifi (kategori/renk/desen/kesim/cinsiyet ipucu) alır.
// Bu tarif daha sonra normal metin tabanlı arama hattına (searchProducts) bir
// sorgu gibi verilir — yani görsel arama, mevcut eşleştirme/skorlama mantığını
// yeniden kullanır, ayrı bir yol icat etmez.
export async function describeImage(imageDataUrl: string): Promise<string> {
  if (!groq) return "";
  try {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Bu fotoğraftaki kıyafeti veya aksesuarı Türkçe, tek bir kısa paragrafla tarif et: " +
                "kategori (tişört, elbise, ayakkabı, çanta, vb.), renk, desen, kesim/stil ve varsa " +
                "cinsiyet ipucu (kadın/erkek/unisex). Sadece düz metin yaz, JSON veya madde işareti kullanma.",
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (error) {
    console.error("Görsel açıklama başarısız oldu:", error);
    return "";
  }
}

export interface SearchResultProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  suitabilityExplanation: string;
  sourceSite: string;
  sourceUrl: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SearchResult {
  products: SearchResultProduct[];
  explanation: string;
  clarify?: { question: string; options: string[] };
}

// Sorgu kelimeleriyle birebir eşleşmeyen ama aynı niyeti taşıyan kelimeleri
// (kumaş/mevsim sınıflandırmasıyla eklenen tag'lere karşılık gelen) genişletir.
const INTENT_SYNONYMS: Record<string, string[]> = {
  serin: ["serin", "nefes", "hafif", "yazlık"],
  terletmeyen: ["nefes", "serin", "terletmeyen"],
  nefes: ["nefes", "serin"],
  sıkmayan: ["nefes", "serin", "hafif"],
  hafif: ["hafif", "nefes", "serin"],
  sıcak: ["sıcak", "kalın", "kışlık"],
  kışlık: ["sıcak", "kalın", "kışlık"],
  kalın: ["kalın", "sıcak", "kışlık"],
  yazlık: ["yazlık", "serin", "hafif", "nefes"],
};

const GENDER_PATTERN = /\berkek(ler)?\b|\bkad[iı]n(lar)?\b|\bbay\b|\bbayan\b|unisex|fark etmez/i;

type GenderFilter = "kadın" | "erkek" | null;

function resolveGenderFilter(text: string): GenderFilter {
  const lower = text.toLowerCase();
  const wantsFarkEtmez = /fark etmez|unisex/.test(lower);
  if (wantsFarkEtmez) return null;
  const wantsKadin = /\bkad[iı]n(lar)?\b|\bbayan\b/.test(lower);
  const wantsErkek = /\berkek(ler)?\b|\bbay\b/.test(lower);
  if (wantsKadin && !wantsErkek) return "kadın";
  if (wantsErkek && !wantsKadin) return "erkek";
  return null;
}

function matchesGender(product: Product, gender: GenderFilter): boolean {
  if (!gender) return true;
  const haystack = `${product.name} ${product.tags}`.toLowerCase();
  const hasKadin = /\bkad[iı]n\b/.test(haystack);
  const hasErkek = /\berkek\b/.test(haystack);
  const hasUnisex = /unisex/.test(haystack);
  if (hasUnisex) return true;
  if (gender === "kadın") return hasKadin || !hasErkek;
  return hasErkek || !hasKadin;
}

function expandQueryWords(query: string): string[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const expanded = new Set(words);
  for (const w of words) {
    const synonyms = INTENT_SYNONYMS[w];
    if (synonyms) synonyms.forEach((s) => expanded.add(s));
  }
  return [...expanded];
}

const CANDIDATE_POOL_SIZE = 20;

export interface SearchIntent {
  mustHaveKeywords: string[];
  avoidKeywords: string[];
  reasoning: string;
}

const EMPTY_INTENT: SearchIntent = { mustHaveKeywords: [], avoidKeywords: [], reasoning: "" };

// Sohbetteki örtük, fiziksel/bağlamsal kısıtları (örn. "rüzgarlı olacak,
// uçmasın" → geniş etek/uçuşan kumaştan kaçın) modelin dünya bilgisiyle
// çıkarır. Sabit bir eş anlamlı sözlüğü yerine bunu kullanmamızın sebebi:
// sözlük sadece önceden düşünülmüş kısıtları yakalar, bu ise genellenebilir.
async function extractSearchIntent(effectiveQuery: string): Promise<SearchIntent> {
  if (!groq) return EMPTY_INTENT;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sen deneyimli bir kişisel stilistsin. Kullanıcının sohbet metnini oku ve söylediklerinin " +
            "ARDINDAKİ fiziksel/bağlamsal gerçek dünya kısıtlarını çıkar (örn. rüzgarlı bir ortamda " +
            "geniş etek/uçuşan/şifon kumaş uçuşur, düğün gibi bir ortamda rahat hareket gerekir, koşarken " +
            "kısıtlayıcı dar kesim sorun olur, vb.). Bu çıkarımlara dayanarak Türkçe, ürün başlıklarında " +
            "geçebilecek kısa kesim/kumaş/stil anahtar kelimeleri üret. " +
            'Şu JSON şemasıyla yanıt ver: {"mustHaveKeywords": string[], "avoidKeywords": string[], "reasoning": string}. ' +
            "reasoning alanına, çıkarımının kısa gerekçesini yaz (bu daha sonra kullanıcıya gösterilebilir). " +
            "Eğer metinde böyle bir fiziksel/bağlamsal kısıt yoksa (sadece düz bir ürün/kategori isteniyorsa), " +
            "her iki listeyi de boş bırak.",
        },
        { role: "user", content: effectiveQuery },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return EMPTY_INTENT;

    const parsed = JSON.parse(raw) as Partial<SearchIntent>;
    return {
      mustHaveKeywords: (parsed.mustHaveKeywords ?? []).map((k) => k.toLowerCase()),
      avoidKeywords: (parsed.avoidKeywords ?? []).map((k) => k.toLowerCase()),
      reasoning: parsed.reasoning ?? "",
    };
  } catch (error) {
    console.error("Niyet çıkarımı başarısız oldu, kısıtsız devam ediliyor:", error);
    return EMPTY_INTENT;
  }
}

async function findCandidateProducts(
  query: string,
  gender: GenderFilter,
  intent: SearchIntent = EMPTY_INTENT
): Promise<{ candidates: Product[]; genderMatchFailed: boolean; avoidFilterFailed: boolean }> {
  const words = expandQueryWords(query);
  const allProducts = await db.product.findMany();
  const genderFiltered = allProducts.filter((p) => matchesGender(p, gender));

  // Bazı kategoriler (örn. sadece "erkek tişört" olarak taranmış) hiç karşı
  // cinsiyette ürün içermeyebilir; bu durumda tamamen boş dönmek yerine
  // filtresiz devam edip bunu kullanıcıya dürüstçe açıklıyoruz.
  const genderMatchFailed = gender !== null && genderFiltered.length === 0;
  let pool = genderMatchFailed ? allProducts : genderFiltered;

  // avoidKeywords ile eşleşen ürünleri havuzdan çıkar (örn. "şifon", "volanlı").
  // Aynı dürüstlük ilkesiyle: bu filtre havuzu tamamen boşaltıyorsa filtresiz devam edip belirtiyoruz.
  let avoidFiltered = pool;
  if (intent.avoidKeywords.length > 0) {
    avoidFiltered = pool.filter((p) => {
      const haystack = `${p.name} ${p.description} ${p.tags}`.toLowerCase();
      return !intent.avoidKeywords.some((kw) => haystack.includes(kw));
    });
    if (avoidFiltered.length > 0) pool = avoidFiltered;
  }
  const avoidActuallyFailed = intent.avoidKeywords.length > 0 && avoidFiltered.length === 0;

  const allWords = [...words, ...intent.mustHaveKeywords];

  if (allWords.length === 0) {
    return { candidates: pool.slice(0, CANDIDATE_POOL_SIZE), genderMatchFailed, avoidFilterFailed: avoidActuallyFailed };
  }

  const scored = pool
    .map((p) => {
      const haystack = `${p.name} ${p.description} ${p.category} ${p.fabric ?? ""} ${p.season ?? ""} ${p.tags}`.toLowerCase();
      const wordScore = words.reduce((acc, w) => acc + (haystack.includes(w) ? 1 : 0), 0);
      const mustHaveScore = intent.mustHaveKeywords.reduce((acc, w) => acc + (haystack.includes(w) ? 2 : 0), 0);
      return { product: p, score: wordScore + mustHaveScore };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return {
      candidates: scored.slice(0, CANDIDATE_POOL_SIZE).map((s) => s.product),
      genderMatchFailed,
      avoidFilterFailed: avoidActuallyFailed,
    };
  }

  return { candidates: pool.slice(0, CANDIDATE_POOL_SIZE), genderMatchFailed, avoidFilterFailed: avoidActuallyFailed };
}

function genderClarifyQuestion(userName?: string): SearchResult {
  const greeting = userName ? `${userName}, ` : "";
  return {
    products: [],
    explanation: "",
    clarify: {
      question: `${greeting}bunu kimin için arıyoruz? Kadın, erkek, fark etmez — sen seç, ona göre bakayım 🙂`,
      options: ["Kadın", "Erkek", "Fark etmez"],
    },
  };
}

function fallbackResult(
  query: string,
  candidates: Product[],
  userName?: string,
  genderMatchFailed = false,
  avoidFilterFailed = false
): SearchResult {
  const greeting = userName ? `${userName}, ` : "";
  if (candidates.length === 0) {
    return {
      products: [],
      explanation: `${greeting}üzgünüm, "${query}" ile eşleşen bir ürün bulamadım. Farklı kelimelerle tekrar dener misin?`,
    };
  }
  const genderNote = genderMatchFailed
    ? " (Tam istediğin cinsiyette bir eşleşme bulamadım, o yüzden yakın alternatifleri gösteriyorum.)"
    : "";
  const avoidNote = avoidFilterFailed
    ? " (Kaçınman gereken özelliklere sahip olmayan bir ürün bulamadım, o yüzden yakın alternatifleri gösteriyorum.)"
    : "";
  return {
    products: candidates.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      category: p.category,
      suitabilityExplanation: `Bu ürün "${query}" aramanla eşleşen özelliklere sahip.`,
      sourceSite: p.sourceSite,
      sourceUrl: p.sourceUrl,
    })),
    explanation: `${greeting}senin için bulduklarım aşağıda 👇${genderNote}${avoidNote}`,
  };
}

export async function searchProducts(
  query: string,
  history: ChatMessage[] = [],
  userName?: string
): Promise<SearchResult> {
  // Sohbetin en başında, cinsiyete göre gerçekten daralttığımız bir katalog
  // olduğu için (her ürün ya "erkek" ya "kadın" etiketli) önce bunu soruyoruz.
  const priorUserMessages = history.filter((h) => h.role === "user").map((h) => h.content);
  const alreadyAskedGender = history.some((h) => h.role === "assistant" && h.content.includes("kimin için"));
  const combinedText = [...priorUserMessages, query].join(" ");

  if (!alreadyAskedGender && !GENDER_PATTERN.test(combinedText)) {
    return genderClarifyQuestion(userName);
  }

  const effectiveQuery = combinedText;
  const genderFilter = resolveGenderFilter(combinedText);
  const intent = await extractSearchIntent(effectiveQuery);
  const { candidates, genderMatchFailed, avoidFilterFailed } = await findCandidateProducts(
    effectiveQuery,
    genderFilter,
    intent
  );

  if (!groq) {
    return fallbackResult(query, candidates, userName, genderMatchFailed, avoidFilterFailed);
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sen ShopMind adlı, sıcak ve samimi konuşan bir moda alışveriş asistanısın. " +
            (userName ? `Kullanıcının adı ${userName}, ara sıra ona adıyla hitap et. ` : "") +
            "Kullanıcının yazma tarzına (resmi/samimi) ayak uydur, robotik ve kurumsal bir dil kullanma; bir arkadaşınla konuşur gibi doğal yaz. " +
            "Sana kullanıcının aradığı şey (cinsiyet tercihi dahil geçmiş sohbet bağlamıyla birleştirilmiş), " +
            "bu istekten çıkarılmış fiziksel/bağlamsal kısıtlar (avoidKeywords/reasoning) ve elindeki aday ürün listesi verilecek. " +
            "Sadece aday listedeki ürünlerden isteğe en uygun olanları seç (id alanını değiştirme). " +
            "avoidKeywords'ü ciddiye al: bir aday o özelliklere sahipse (adından/açıklamasından anlaşılıyorsa) seçme. " +
            "Eğer istek gerçekten belirsizse (örn. bütçe veya tarz netleşmemiş) ve daha iyi öneri için tek bir kısa netleştirici soru sormak istersen, " +
            'products yerine {"clarify": {"question": string, "options": string[]}} şemasını kullanabilirsin — ama bunu abartma, sadece gerçekten gerekliyse kullan. ' +
            "Aksi halde Türkçe yanıt ver ve şu JSON şemasını kullan: " +
            '{"explanation": string, "products": [{"id": string, "suitabilityExplanation": string}]}. ' +
            "suitabilityExplanation'ı jenerik ('aramanla eşleşiyor' gibi) yazma — reasoning'de belirtilen fiziksel/bağlamsal " +
            "gerekçeyi somut şekilde yansıt (örn. 'bu elbise dar kesim olduğu için rüzgarda uçma riski düşük'). " +
            "Eğer hiçbir ürün uygun değilse products dizisini boş bırak ve explanation içinde nazikçe açıkla.",
        },
        {
          role: "user",
          content: JSON.stringify({
            query: effectiveQuery,
            avoidKeywords: intent.avoidKeywords,
            mustHaveKeywords: intent.mustHaveKeywords,
            reasoning: intent.reasoning,
            candidates: candidates.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              category: p.category,
              fabric: p.fabric,
              season: p.season,
              tags: p.tags,
              price: p.price,
            })),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallbackResult(query, candidates, userName);

    const parsed = JSON.parse(raw) as {
      explanation?: string;
      products?: { id: string; suitabilityExplanation: string }[];
      clarify?: { question: string; options: string[] };
    };

    if (parsed.clarify?.question) {
      return { products: [], explanation: "", clarify: parsed.clarify };
    }

    const byId = new Map(candidates.map((p) => [p.id, p]));
    const products: SearchResultProduct[] = (parsed.products ?? [])
      .map((entry) => {
        const product = byId.get(entry.id);
        if (!product) return null;
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          suitabilityExplanation: entry.suitabilityExplanation,
          sourceSite: product.sourceSite,
          sourceUrl: product.sourceUrl,
        };
      })
      .filter((p): p is SearchResultProduct => p !== null);

    return {
      products,
      explanation: parsed.explanation ?? `"${query}" için bulduğum ürünler aşağıda.`,
    };
  } catch (error) {
    console.error("Groq araması başarısız oldu, yerel aramaya geçiliyor:", error);
    return fallbackResult(query, candidates, userName);
  }
}
