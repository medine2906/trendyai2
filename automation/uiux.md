# TrendAI — UI/UX Tasarım Rehberi

> Bu dosya, sitenin görsel kimliğiyle ilgili kalıcı kararları tutar. Yeni bir
> oturum/agent tasarımla ilgili bir şey değiştirmeden önce bu dosyayı okumalı.
> DESIGN.md'nin (eski, silinmiş) yerini alan güncel referans budur.

## 1) Amaç ve durum

- **Amaç:** TrendAI'nin "sosyal + AI destekli alışveriş" kimliğini, mevcut
  mor/krem renk paletini koruyarak "luxury" (butik/atölye hissi veren, ucuz
  görünmeyen) bir seviyeye taşımak — ama sitenin temel özelliklerini (AI ile
  sohbet arama, Keşfet/Instagram-tarzı feed, sosyal paylaşım, sepete ekleme)
  değiştirmeden.
- **Durum (2026-08-04):** 3 konsept demo sayfası `src/app/design-concepts/`
  altında hazırlandı, kullanıcı onayı BEKLENİYOR. Hiçbir gerçek route/dosya
  değişmedi. Bkz. bölüm 9 (Demo route indeksi) ve bölüm 10 (Karar günlüğü).

## 2) Marka kimliği kısıtları (değişmez)

- Renk ailesi **mor + krem/parşömen** olarak kalır — yeni bir hue ailesi
  (örn. indigo/mavi, yeşil) icat edilmeyecek. "Luxury" hissi renk değiştirerek
  değil, kontrast/doku/spacing/tipografi/ışık-gölge disiplini ile üretilecek.
- Bu bir istisnadır: genel "AI tasarımlarında mor/indigo kullanma" kuralı,
  burada geçerli değildir çünkü mor zaten bu markanın kurulu kimliği
  (kullanıcı açıkça istedi, `globals.css`'te yıllardır `--primary`/`--accent`
  olarak var).

## 3) Palet token tablosu

| Token | Light | Dark | Kullanım | Luxury'ye taşıma notu |
|---|---|---|---|---|
| `--background` | `#f4f1e4` | `#0b0a08` | sayfa zemini | Light'ta zaten parşömen; koyu konseptte bu zemin `#0b0a08`'in kendisi kullanılabilir (yeni renk değil, dark-mode değeri) |
| `--card` | `#fcfaf1` | `#151310` | kart/yüzey | |
| `--muted` | `#ebe7d8` | `#211f1a` | ikincil yüzey, hover | |
| `--muted-foreground` | `#6b6a60` | `#a8a596` | ikincil metin | |
| `--border` | `#000000` | `#fcfaf1` | ayraç çizgisi | Luxury konseptlerde saf `#000`/`#fff` yerine `color-mix(in srgb, var(--border) 20-35%, transparent)` gibi yumuşatılmış opaklık kullanılabilir — token DEĞİŞMEZ, sadece opaklık uygulanır |
| `--primary` | `#6b579e` | `#b8aad0` | ana CTA, aktif state | |
| `--accent` | `#b8aad0` | `#b8aad0` | lavanta vurgu | Tek aksan rengi — birden fazla "hero color" eklenmeyecek |
| `--foreground` | `#000000` | `#fcfaf1` | ana metin | |

Kural: yeni token gerekiyorsa (örn. yumuşatılmış kenarlık, hover-strong)
`globals.css`'e eklenmeden önce bu tabloya satır olarak eklenip gerekçesi
yazılır. Demo aşamasında deneysel token'lar sadece `design-concepts/`
içinde local scope'ta kalır (bkz. bölüm 8).

## 4) Tipografi

- **Inter** (`--font-good-sans`) — gövde metni, mevcut kullanım korunuyor.
- **Fraunces** (`--font-redaction`) — şu an sadece marka wordmark'ında
  kullanılıyor; luxury konseptlerde bölüm başlıklarına (`h2`/`h3`) da
  genişletilebilir (Quiet Luxury ve Soft Lavender konseptlerinde denendi).
- **Space Grotesk** (`--font-sui`) — yüklü ama hiç kullanılmıyor; Maison Noir
  konseptinde fiyat/etiket gibi mikro-metinlere rol verildi (deneysel).
- Kural: bir sayfada en fazla 2 font ailesi aktif rol oynar (gövde + başlık).
  Fraunces'i "tek kelimeyi italik/serif yaparak sahte zarafet" kalıbında
  KULLANMA (bkz. refero-design anti-ai-slop kural #4) — bölüm başlığı bütünüyle
  Fraunces ya da bütünüyle Inter olur, tek kelime vurgusu yapılmaz.

## 5) Spacing / radius / border kuralları

- Mevcut sistem 0px radius (rounded-none), Avatar hariç (rounded-full).
  Luxury konseptlerde bu korunabilir (Quiet Luxury, Maison Noir) VEYA
  kontrollü küçük bir radius (2-4px) denenebilir (Soft Lavender'da denendi) —
  hangisinin onaylanacağına kullanıcı karar verir.
- Explore grid'in `5px` gap değeri bir Tailwind class'ı değil inline
  `style={{gap:"5px"}}` — luxury konseptlerde bu değer korunuyor (Instagram
  tarzı "flush grid" hissi, Trendyol/Amazon'daki boşluklu kart gridinden
  bilinçli olarak farklı, TrendAI'nin "sosyal" kimliğinin parçası).
- 8px spacing grid'e uyulur (`p-4`, `p-6`, `p-8`, `gap-4`, `gap-6`) — luxury
  hissi boşluk artırarak (yoğunluğu azaltarak) verilir, spacing'i bozarak değil.

## 6) İkon yerleşim kuralları + gerekçe

Trendyol, Amazon, Hepsiburada, Cimri gibi Türkiye'de yaygın e-ticaret
sitelerinde kullanıcıların yıllardır alıştığı, güven hissi veren yerleşim
kalıpları:

- **Sepet ikonu her zaman sağ üstte**, rozet (badge) ile birlikte —
  kullanıcı "alışveriş" hissi arayınca refleks olarak sağ üste bakar; farklı
  bir köşede olması "bu site normal bir alışveriş sitesi değil, bir şeyler
  farklı" hissi yaratıp güveni azaltabilir.
- **Arama / AI-sohbet girişi üstte, ortada veya sol üstte** — kullanıcı önce
  ne aradığını bulmaya çalışır, bu her zaman en görünür üst bölgede olur.
- **Bildirim ve mesaj ikonları sepetin yakınında kümelenir** (genelde sepetin
  solunda) — "hesabımla ilgili şeyler" kümesi olarak birlikte okunur.
- **Profil/hesap erişimi ya sağ üstte (topbar-only siteler) ya da sabit bir
  köşede/sidebar altında** (uygulama-tarzı, sekmeli sitelerde) — TrendAI
  zaten sidebar-alt profil pattern'ini kullanıyor, bu KORUNUYOR; sağ üstte
  hem sepeti hem profili aynı kümeye koymak (ikisini birbirine
  karıştırmak) kullanıcı testlerinde daha çok tıklama hatasına yol açtığı
  bilinen bir anti-pattern olduğu için kullanıcı onayıyla ELENDİ.
- **Kural:** hiçbir ikon "özgünlük" için beklenmedik bir köşeye taşınmaz.
  Güven, yenilikten önce gelir. Görsel kimlik (renk/doku/tipografi) ile
  ayrışılır, ikon coğrafyasıyla değil.

Üç demo konseptinin hepsi bu kurala uyar: **sepet sağ üst + rozet, profil
sol alt/sidebar-alt** — sadece renk/kontrast/doku ile ayrışırlar.

## 7) Pazarlama/psikoloji ilkeleri (luxury-uygun)

Kullanılacak (sessiz, zarif uygulama):
- **Sessiz sosyal kanıt** — "12 kişi bu haftaki seçkiye ekledi" gibi bir
  rozet yerine küçük, tek satırlık, abartısız metin (örn. ürün kartında
  küçük "Bu hafta öne çıkanlardan" etiketi — sayı vurgusu yok).
- **Tek baskın CTA** — bir görünümde birden fazla eşit ağırlıklı buton olmaz;
  "Sepete ekle" her zaman en belirgin aksiyon, diğerleri (beğen, kaydet)
  ikincil/ghost stilde kalır.
- **Whitespace bir lüks sinyali** — yoğun grid yerine nefes alan boşluk,
  özellikle hero ve ürün detayında.
- **Fiyat çapalama** — ilgili/benzer ürün önerilerinde fiyat aralığı
  gösterimi, "İndirimliii!!!" tarzı patlamalar olmadan sade biçimde.
- **Kıtlık — sadece veri destekliyse, sakin tonda** — örn. gerçek stok
  bilgisi varsa "Sınırlı sayıda" gibi sade bir not; uydurma "3 kişi bakıyor"
  YOK.

Kullanılmayacak (anti-pattern):
- Geri sayım sayaçları, sahte "şu an X kişi inceliyor" göstergeleri.
- Kırmızı/sarı patlama şeklinde indirim rozetleri.
- Aşırı sayıda eşit-ağırlıklı buton/CTA.

## 8) Bileşen envanteri

**Olduğu gibi tekrar kullanılan primitifler** (`src/components/ui/`):
`Button`, `Card`, `Avatar`, `Tooltip` — zaten token-tabanlı, luxury demo
sayfalarında bunlar import edilip kullanılıyor.

**Korunması ZORUNLU özellik bileşenleri/route'ları** (luxury redesign bunları
kaldırmaz, sadece görsel katmanını değiştirir):
- AI sohbet arama: `src/app/(main)/chat/`, `src/lib/groq.ts`
- Keşfet/Instagram-tarzı grid: `src/components/explore/explore-grid.tsx`,
  `explore-feed.tsx`
- Sosyal paylaşım/post kartı: `src/components/feed/post-card.tsx`,
  `product-post-card.tsx`
- Sepete ekleme: `src/components/commerce/add-to-cart-button.tsx`,
  `src/app/(main)/cart/`

**Demo'ya özel, gerçek layout'a dokunmayan yeni bileşenler**
(`src/app/design-concepts/_components/`): header/sidebar/topbar varyantları,
gerçek `main-shell.tsx`'ten bağımsız, sadece mevcut token'ları kullanır.

## 9) Demo route indeksi

- `/design-concepts` — **tek** luxury konsept sayfası (v2). v1'deki 3 ayrı
  statik konsept (`quiet-luxury`, `maison-noir`, `soft-lavender`) ve index
  sayfası SİLİNDİ (bkz. bölüm 10 — kullanıcı hepsini reddetti). Yeni sayfa
  gerçek DB verisiyle çalışır (statik placeholder yok): editorial hero (gerçek
  ürün görseli), AI sohbet paneli mockup'ı (gerçek `/chat`'e link), Instagram
  ana-sayfa tarzı bir ürün feed'i (gerçek beğeni/sepet/yorum), ve
  `_components/luxury-reels-feed.tsx` ile Reels-tarzı dikey kaydırmalı bir
  Keşfet bölümü (yine gerçek beğeni/sepet/yorum). İkon yerleşimi aynı kalır:
  sepet sağ üstte, profil sağ üstte avatar olarak erişilebilir (bu tek sayfalık
  demo bağlamında sidebar yok, üst şerit kullanılıyor).

> Bu route, kullanıcı tasarımı onaylayıp gerçek implementasyon (gerçek
> `main-shell.tsx`/`globals.css`) tamamlandıktan SONRA silinir.

## 10) Karar günlüğü

- **2026-08-04 (v1, reddedildi)** — 3 farklı statik/mockup luxury konsept
  (Quiet Luxury, Maison Noir, Soft Lavender) hazırlandı, kullanıcı **hepsini
  reddetti**. Sebep renk/tema değil: sayfalar statik kaldı — gerçek veri yok,
  sepete-ekle/beğen tıklanamıyor, yorum özelliği hiç yoktu, "kaydırmalı" his
  zayıftı. Kullanıcının asıl isteği: Instagram gibi kaydırmalı/paylaşmalı,
  LLM-sohbet gibi AI arama, alışveriş sitesi gibi gerçekten çalışan ürünler,
  ürünlere yorum yazabilme.
- **2026-08-04 (v2, uygulandı)** — Tek, gerçek özellikli bir konsepte
  geçildi. Yeni `ProductComment` Prisma modeli eklendi (migration:
  `add_product_comments`), `addProductComment` server action'ı
  (`src/lib/actions.ts`) ve `ProductCommentList` bileşeni
  (`src/components/commerce/product-comment-list.tsx`) — bu özellik SADECE
  demoda değil, kullanıcı onayıyla **gerçek `/product/[id]` sayfasına da**
  eklendi. Demo sayfasındaki sepete-ekle/beğen butonları da kullanıcı
  onayıyla gerçek aksiyonlara bağlandı (sitenin gerçek `AddToCartButton`/
  `LikeProductButton` bileşenleri). Sonraki adım: kullanıcının
  `/design-concepts`'i tarayıcıda gezip görsel/etkileşim olarak onaylaması
  (veya revizyon istemesi) bekleniyor — onay sonrası ana sidebar/renk sistemi
  bu yönde gerçek implementasyona taşınacak.
