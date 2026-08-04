# TrendAI

TrendAI, bir moda/e-ticaret keşif ve sosyal ağı uygulamasıdır. Önceden Firebase
(Auth + Firestore + Genkit/Gemini) ile yapılmış bir hackathon projesinin
Firebase'siz olarak yeniden inşa edilmiş hâlidir.

## Stack

- **Next.js 16.2.10** (App Router) — dikkat: bu proje yolu ASCII olmayan bir
  karakter içerdiği için ("Masaüstü") Turbopack çöküyor, `npm run dev` webpack
  ile çalışacak şekilde ayarlandı.
- **React 19**
- **Tailwind v4** (CSS-first config)
- **Prisma + SQLite**
- **NextAuth v5** — Credentials (bcrypt) + Google OAuth, JWT tabanlı, adapter yok
- **Groq** (`groq-sdk`, `llama-3.3-70b-versatile`) — AI destekli ürün arama için
- UI bileşenleri `src/components/ui/` altında shadcn/ui kullanılmadan sıfırdan yazıldı

## Özellikler

- **Auth**: `/login`, `/signup`, `/forgot-password`, Google ile giriş
- **Ana sayfa**: story reel, feed (beğeni/kaydetme), "Senin için önerilenler"
- **AI arama** (`/chat`): sohbetten bağlamsal kısıtları çıkarıp (örn. "düğünde
  giyeceğim, rüzgarlı olacak") ürün önerileri sunar; önerilen ürüne tıklamak
  doğrudan kaynak siteye (Amazon/Trendyol) götürür
- **Ticaret**: `/product/[id]`, `/cart` — ödeme akışı yok, sepet sadece saklama
  amaçlı; ürüne tıklamak kaynak siteye yönlendirir
- **Sosyal**: `/explore`, `/messages`, `/saved`, `/activity`, `/profile/[username]`
  (gizlilik ayarına saygılı)
- **Ürün verisi**: `prisma/sources/` altında pluggable adapter mimarisi (Amazon,
  Trendyol) — `npm run products:refresh` ile scrape + LLM etiketleme

## Başlarken

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini tarayıcıda aç.

Gerekli ortam değişkenleri için `.env.example` dosyasına bak (`GROQ_API_KEY`,
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, vb.).

## Daha fazla bilgi

Projenin güncel durumu, yapılan değişiklikler ve bilinen eksikler için
[CLAUDE.md](CLAUDE.md) dosyasına bakın — her önemli değişiklikten sonra güncellenir.
