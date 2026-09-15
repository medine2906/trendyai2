@AGENTS.md

# Proje Durumu (ShopMind)

> Bu bölüm her önemli değişiklik/compact sonrası güncellenir. Yeni bir oturuma başlarken
> tüm dosyaları taramak yerine önce burayı oku; sadece ilgili dosyaları aç.
>
> **Not:** Proje 2026-09-15'te "TrendAI" isminden **"ShopMind"** ismine geçirildi
> (Trendyol ile marka karışıklığı/hukuki risk endişesiyle + artık sadece giyim değil,
> genel ürün önerisi hedeflendiği için "trend" kökü terk edildi). `package.json` `name`
> alanı da `shopmind` oldu. Bu dosyadaki eski "Durum" günlük kayıtları TARİHSEL —
> içlerindeki "TrendAI" adı o zamanki isim, geriye dönük değiştirilmedi.

## Özet
ShopMind (eski adıyla TrendAI), önceden Firebase (Auth+Firestore+Genkit/Gemini) ile
yapılmış bir hackathon projesinin Firebase'siz yeniden inşası. Stack: Next.js 16.2.10
(App Router, breaking changes — `middleware.ts` yerine `proxy.ts`), React 19, Tailwind v4
(CSS-first config), Prisma + SQLite (Supabase/Postgres'e geçiş planlanıyor, bkz. aşağıdaki
"Durum" girdisi), NextAuth v5 (Credentials + JWT + Google OAuth, adapter yok — Google
kullanıcıları signIn callback'inde manuel upsert edilir), Groq (`groq-sdk`,
`llama-3.3-70b-versatile`) AI arama için — Gemini/Grok DEĞİL. UI bileşenleri shadcn/ui
kullanılmadan sıfırdan yazıldı (`src/components/ui/`). Ürün görselleri artık gerçek:
Amazon.com.tr arama sonuçlarından scrape edilen `m.media-amazon.com` görselleri
(picsum placeholder KALDIRILDI).

## Durum: Ürün etiketleme derinleştirildi — bağlamsal/fiziksel etiketler (2026-09-15)
`prisma/classify-products.ts` genişletildi (bkz. `test.md` Faz 3): (1) LLM'e artık
sadece name/description/category değil, doluysa `rawDescription` ve `specifications`
de gönderiliyor (bu alanlar şemada duruyordu ama hiçbir adapter/script tarafından
kullanılmıyordu); (2) LLM sistem promptu artık ürünlerin SADECE giyim olmayabileceğini
(elektronik, ev eşyası vb.) belirtiyor ve etiketleri kategoriye göre uydurmasını
söylüyor — "ShopMind" artık kategori-bağımsız olduğu için; (3) en önemlisi, prompt
artık kullanıcıların sohbette sorduğu türden FİZİKSEL/BAĞLAMSAL kullanım senaryolarına
(hava koşulu uygunluğu — "rüzgarda uçuşabilir/uçuşmaz", "yağmurda ıslanır", "suya
dayanıklı"; hareket kolaylığı — "hareket serbestliği sağlar/hareketi kısıtlar";
konfor/dayanıklılık) karşılık gelen somut etiketler üretmesini istiyor, uydurma etiket
eklememesi konusunda uyarılıyor. Bu, `src/lib/groq.ts`'teki mevcut `extractSearchIntent`
+ `findCandidateProducts` pipeline'ının (avoidKeywords/mustHaveKeywords, ürün `tags`
alanına karşı eşleştiriliyor) doğrudan besleyicisi — yani "rüzgarlı havada uçuşmasın"
gibi bir istek artık hem LLM'in anlık akıl yürütmesine hem de önceden üretilmiş somut
etiketlere dayanabiliyor. Regex/anahtar-kelime yedek yolu (`GROQ_API_KEY` yoksa) da
paralel güncellendi: `regexClassify` artık `rawDescription`'ı da tarıyor, ve
`CONTEXT_TAGS_BY_SILHOUETTE` haritası (`salaş`/`pileli`/`şifon` → "rüzgarda uçuşabilir",
`dar kesim`/`streç` → "rüzgarda uçuşmaz" vb.) mevcut silüet etiketlerinden bağlamsal
etiketler türetiyor — yani LLM yokken bile temel düzeyde bağlamsal etiketleme çalışıyor.
**Doğrulanmadı**: Bu ortamda `node_modules`/`.env`/gerçek `GROQ_API_KEY` yok, bu yüzden
script çalıştırılıp gerçek bir LLM çıktısı görülemedi — sadece kod okunarak/statik
olarak doğrulandı (mevcut fonksiyon imzaları ve Prisma `Product` tipiyle uyumlu).
Kullanıcının kendi ortamında bir sonraki adım: `FORCE_RECLASSIFY=1 npx tsx
prisma/classify-products.ts` ile birkaç ürünü yeniden etiketleyip DB'den örnek
satırlarda yeni bağlamsal etiketlerin gerçekten üretildiğini kontrol etmek.
`specifications`/`rawDescription` alanlarını henüz hiçbir kaynak adapter'ı doldurmuyor
(bkz. CLAUDE.md'deki "Çoklu-kaynak adapter mimarisi" durumu) — bu alanlar dolu
geldiğinde LLM'e otomatik olarak iletilecek, adapter'ları doldurmak ayrı bir iş.

## Durum: İsim değişikliği TrendAI → ShopMind (2026-09-15)
Kullanıcı, "TrendAI" isminin "Trendyol" ile karışabileceğini (hukuki risk) ve ürünün
sadece giyimle sınırlı olmayacağını (genel ürün önerisi — giyim, elektronik, vb.)
belirtti; "trend" kökünden bağımsız yeni bir isim istendi. `test.md`'de sunulan
seçeneklerden onay gelmeyince (kullanıcı sadece "sadece kıyafet için değil" notunu
düştü) **ShopMind** ismi seçilerek uygulandı — genel/kategori-bağımsız bir çağrışım.
Değiştirilen yerler: `package.json` (`name`), tüm UI metinleri (`src/app/layout.tsx`
title, login/signup/signin sayfaları, `main-shell.tsx` sidebar logosu, `auth-layout.tsx`,
`apple-style-showcase-preview.tsx`, `nav-overlay-menu.tsx`, `numbered-features.tsx`,
`product-showcase-demo.tsx`, `design-concepts/*`), `src/lib/groq.ts`'teki sistem
promptundaki asistan kimliği, `README.md`, `automation/uiux.md`,
`.claude/skills/frontend-design/SKILL.md`. Bu dosyadaki (CLAUDE.md) geçmiş "Durum"
kayıtları kasıtlı olarak değiştirilmedi (tarihsel kayıt niteliğinde).
Doğrulama: `grep -rn "TrendAI"` proje genelinde artık sadece `test.md` ve bu dosyanın
tarihsel bölümlerinde geçiyor, kod/`src`'de sıfır sonuç. **Yapılmadı**: marka
kimliği/görsel tasarım (renk, tipografi, logo) henüz "ShopMind"e göre yeniden
düşünülmedi — bu, ayrı onaylanan UI yenileme fazında ele alınacak (bkz. `test.md`).
Kullanıcı ayrıca Supabase'e geçişi ve sonraki fazların (ürün etiketleme, UI yenileme,
ana sayfa mock sosyal özellikler, explore büyüme animasyonu) sormadan sırayla
uygulanmasını onayladı — bu fazlar sıradaki oturum/adımlarda uygulanacak.

## Durum: Uçtan uca test otomasyonu kuruldu — frontend+backend+DB (2026-08-04)
Kullanıcı "her şeyi test eden bir otomasyon kur" dedi. Üç katmanlı, gerçek (mock'suz)
bir test paketi eklendi, hepsi **izole bir test veritabanında** (`prisma/test.db`,
gerçek `.env`'deki geliştirme verisine ASLA dokunmuyor) çalışıyor:
1. **DB bütünlüğü** (`tests/db/integrity.test.ts`, Vitest) — bağlantı, seed ürünlerin
   okunabilirliği, orphan FK kontrolü (CartItem/SearchHistory → User/Product),
   username/email benzersizliği.
2. **API** (`tests/api/*.test.ts`, Vitest) — `/api/signup` ve `/api/waitlist` route
   handler'ları HTTP sunucusu ayağa kaldırmadan doğrudan import edilip çağrılıyor
   (400/201/409 durumları + DB'ye gerçekten yazıldığının doğrulanması).
3. **E2E** (`tests/e2e/*.spec.ts`, `@playwright/test`, gerçek Chromium) — kayıt,
   giriş (doğru/yanlış şifre), korumalı sayfa yönlendirmesi, ürün→sepet akışı,
   AI arama (chat) + arama geçmişi, keşfet grid'i + ürün detay modal'ı. 10/10 geçiyor.

Kurulum kararları ve çözülen sorunlar:
- **Ayrı `.env.test`** — `DATABASE_URL=file:./prisma/test.db`, `GROQ_API_KEY` BİLİNÇLİ
  olarak boş (böylece `/api/chat` deterministik keyword-fallback'e düşer, testler
  gerçek LLM'e para/gecikme harcamaz), `PORT=3100` (kullanıcının olası `npm run dev`
  port 3000 sürecinden ayrı), `AUTH_TRUST_HOST=true` (next-auth'un prod modda
  `UntrustedHost` hatasını önlemek için), `TEST_AUTOMATION=1`.
- **E2E sunucusu `next dev` DEĞİL, `next build --webpack && next start`** — `next dev`
  proje dizini başına tek instance'a izin veriyor (kilit dosyası), kullanıcının kendi
  dev sürecini kilitleyip "Another next dev server is already running" hatası verirdi.
  Ayrıca `next.config.ts`'e `distDir: TEST_AUTOMATION=1 ? ".next-test" : ".next"`
  eklendi — böylece test build'i kullanıcının gerçek `.next` önbelleğini bozmuyor
  (bkz. aşağıdaki "Önemli ders" — `.next` çakışması zaten bilinen bir tuzaktı).
- **Rate limiting'i (bkz. aşağıdaki güvenlik girdisi) test dostu hale getirmek**:
  `checkRateLimit` IP'yi `x-forwarded-for`/`x-real-ip` header'ından okuyor, Playwright/
  localhost istekleri bu header'ı hiç göndermediği için TÜM testler aynı `"unknown"`
  bucket'ını paylaşıyordu → `/api/signup` 15dk'da 5 istekle sınırlı olduğu için 5.
  testten sonra tüm signup'lar 429 ile patlıyordu. Çözüm: sadece signup FORM'unu
  gerçekten test eden tek bir test gerçek UI signup'ını kullanıyor; oturum açmış bir
  kullanıcıya ihtiyaç duyan diğer tüm testler `tests/e2e/helpers.ts`'teki
  `createTestUser()` (doğrudan Prisma+bcrypt) + `loginViaUI()` ile kullanıcı yaratıp
  giriş yapıyor — signup endpoint'ini bir kez daha çağırmıyor.
- **`page.context().clearCookies()` + aynı sayfada yeniden `/login`'e gitmek güvenilir
  değil** — bir testte cookie temizliği sonrası proxy.ts hâlâ eski oturumu görüp
  `/login`'i `/home`'a geri yönlendirdi, test "hang" gibi göründü. Çözüm: ayrı oturum
  gereken testler `browser.newContext()` ile tamamen yeni bir context kullanıyor.
- **Gündelik/zamanlanmış otomatik koşuda `prisma db push` KULLANILMIYOR** — Task
  Scheduler'ın (Interactive logon, konsol yok) non-interactive stdin'i altında hem
  `prisma db push` hem `vitest` ilk saniyede sessizce `^C` ile öldü (muhtemelen bu
  CLI'ların stdin'e raw-mode/Ctrl+C dinleyicisi takması, gerçek TTY olmayan bir
  stdin'de yanlış tetiklenmesi). `npm run test:db:push` (şema senkronu) artık
  `test:all` zincirinden ÇIKARILDI, sadece şema değiştiğinde MANUEL çalıştırılması
  gerekiyor; nightly `test:all` = seed+db+api+e2e (şema zaten kurulu olduğu için
  buna ihtiyaç yok). Task action'ına `< NUL` stdin yönlendirmesi de eklendi (zararsız
  ek güvence). **Yanlış teşhis edilen bir tuzak:** ilk denemelerde görevi tetikledikten
  sonra AYNI PowerShell tool çağrısı içinde `Start-Sleep` ile bekleyip log kontrol
  etmek görevi anlık `^C` ile öldürüyormuş gibi görünüyordu — asıl sebep budur (o
  PowerShell tool çağrısının kendisi sonlanırken paylaşılan konsola sinyal
  gönderiyor gibi davranıyor), CLI'ların stdin quirk'ü değil. Görevi tetikleyip
  SONRA tamamen AYRI bir tool çağrısında log/durum kontrol etmek sorunu çözdü.
- **Windows Task Scheduler**: "TrendAI Test Otomasyonu" adında, her gece 01:30'da
  (mevcut "TrendAI Urun Yenile" 6 saatlik döngüsüyle çakışmayacak bir saat) `npm run
  test:all` çalıştıran görev kaydedildi, log `%TEMP%\trendai-test-automation.log`.
  Aynı `StartWhenAvailable`/`MultipleInstances IgnoreNew`/`RestartCount` deseni
  kullanıldı (bkz. "Urun Yenile" görevi). Manuel tetikleme: `Start-ScheduledTask
  -TaskName "TrendAI Test Otomasyonu"`.
Doğrulama: `npm run test:all` hem interaktif shell'den hem gerçek zamanlanmış görev
üzerinden (Task Scheduler ile tetiklenip log dosyasından okunarak) uçtan uca koşturuldu
— DB 6/6, API 6/6, E2E 10/10 geçti. Bu koşu ayrıca aynı anda çalışan güvenlik-düzeltme
oturumunun (bkz. aşağıdaki "8 güvenlik açığı düzeltildi" girdisi) test EDİLMEMİŞ diye
işaretlediği birkaç şeyi dolaylı olarak doğruladı: `/api/signup` rate limiting'in
gerçekten 429 döndürdüğü (manuel curl ile 6. istekte doğrulandı), CSP header'larının
signup/login/chat/cart/explore/product sayfalarındaki hiçbir mevcut özelliği kırmadığı.
**Doğrulanmayan/yapılmayan**: private hesap toggle'ı, `/api/chat` ve login rate
limit'lerinin 429 davranışı E2E'de ayrıca test edilmedi; GROQ_API_KEY gerçek bir LLM
anahtarıyla chat akışı test edilmedi (bilinçli olarak fallback moda sabitlendi).

## Durum: 8 güvenlik açığı düzeltildi (2026-08-04)
Explore agent ile 12 kategoride (auth, API route'lar, secrets, Prisma şeması, dosya
yükleme, XSS, CSRF, header'lar, rate limiting, dependency'ler, scraper'lar, IDOR)
tam bir güvenlik taraması yapıldı, ardından kullanıcı onayıyla bulunan tüm sorunlar
sırayla düzeltildi:
1. **Private hesap artık gerçekten çalışıyor** — `profile/[username]/page.tsx` ve
   `profile/[username]/follows/[tab]/page.tsx` artık `user.isPrivate` + takip
   ilişkisini kontrol ediyor (`canViewPosts`/`alreadyFollowing` mantığı); önceden
   `isPrivate` DB'de duruyordu ama hiçbir query'de okunmuyordu, "gizli" hesaplar
   herkese açıktı.
2. **Rate limiting eklendi** — yeni `src/lib/rate-limit.ts` (tek-process in-memory,
   `Map`-tabanlı `checkRateLimit(key, limit, windowMs)`), 4 noktaya uygulandı:
   `/api/signup` (IP başına 15dk'da 5), `/api/waitlist` (IP başına 15dk'da 5),
   `/api/chat` (kullanıcı başına 10dk'da 20 — Groq maliyet istismarını önlemek
   için asıl motivasyon buydu), `src/lib/auth.ts`'teki credentials `authorize`
   (email başına 15dk'da 10 — brute-force login koruması). **Önemli sınır:** bu
   limiter paylaşılan değil, tek Node process'i içinde çalışıyor — çoklu
   instance/serverless'a geçilirse Redis gibi paylaşılan bir store gerekir.
3. **`.env.example`'daki sızmış gerçek GROQ_API_KEY temizlendi** (boş placeholder'a
   çevrildi). **`.env`'deki gerçek key AYNI KALDI** (uygulamanın çalışması için
   gerekli) — ama bu key `.env.example`'da açıkta durduğu için hâlâ tehlikede
   sayılmalı, **kullanıcının console.groq.com/keys'ten key'i rotate etmesi
   (eskisini silip yenisini `.env`'e koyması) gerekiyor, bu adım yapılmadı**.
4. **`AUTH_SECRET` güçlendirildi** — `.env`'deki `dev-only-secret-change-me-...`
   placeholder'ı `openssl rand -base64 32` ile üretilen gerçek rastgele bir
   değerle değiştirildi.
5. **Güvenlik header'ları eklendi** — `next.config.ts`'e `headers()` fonksiyonu:
   CSP (nonce'suz, statik — `unsafe-inline` script/style için gerekli çünkü nonce
   altyapısı kurulmadı), X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
   Permissions-Policy, ve prod'da (dev'de değil) HSTS.
6. Şifre kuralı `min(6)` → `min(8)` + en az bir harf + en az bir rakam
   (`api/signup/route.ts`).
7. Görsel yükleme artık gerçek dosya byte imzasını (magic number) kontrol ediyor
   (`src/lib/actions.ts` → `matchesImageSignature`, jpeg/png/gif/webp için) —
   önceden sadece tarayıcının beyan ettiği (sahtelenebilir) MIME type'a
   güveniliyordu.
8. `next-auth` `^5.0.0-beta.31` → tam pinlenmiş `5.0.0-beta.31` (`package.json`).
Doğrulama: `npx tsc --noEmit` temiz. **Hiçbiri tarayıcıda uçtan uca test edilmedi**
(özellikle: private hesap toggle'ının gerçekten gizleyip göstermediği, rate
limit'in 429 döndürdüğü, CSP'nin hiçbir mevcut özelliği kırmadığı — CSP'nin
`connect-src 'self'` olması özellikle client-side'dan doğrudan dış domain'e fetch
atan bir kod varsa onu kırabilir, kontrol edilmedi). Bir sonraki oturumda: (a)
dev server'ı başlatıp özellikle profil/gizlilik ve kayıt akışlarını tarayıcıda
dene, (b) kullanıcıya GROQ_API_KEY rotate hatırlatmasını tekrar yap.

## Durum: Çoklu-kaynak adapter mimarisi kuruldu, Amazon geçici 503 blokta (2026-08-04)
Kullanıcı Cimri.com.tr gibi çok siteli, XML/feed destekli bir ürün besleme sistemi + gerçek
production hosting (AWS dahil değerlendirilecek) istedi. Onaylanan plan doğrultusunda Faz 1
tamamlandı: `prisma/scrape-products.ts` ve `prisma/scrape-trendyol.ts` **silindi**, yerine
pluggable adapter mimarisi geldi — `prisma/sources/types.ts` (`SourceAdapter`/`RawProduct`
arayüzü), `prisma/sources/categories.ts` (paylaşılan 49 sorguluk `CATEGORIES` listesi, eskiden
`scrape-products.ts`'te idi), `prisma/sources/scrape-cheerio.ts` ve
`prisma/sources/scrape-playwright.ts` (sayfalama/dedup/gecikme/tags mantığını tek yerde toplayan
paylaşılan iskeletler), `prisma/sources/adapters/amazon.ts` + `adapters/trendyol.ts` (eski
script'lerin birebir aynı scraping mantığı, sadece iskeletlere sarılmış hâli),
`prisma/sources/registry.ts` (aktif adapter listesi) ve `prisma/sources/run.ts` (upsert +
kaynak-bazlı stale-delete'i TEK yerde yapan, önceden iki script'te ayrı ayrı tekrarlanan mantığın
konsolide hâli). `package.json`'daki `products:refresh` artık `tsx prisma/sources/run.ts && tsx
prisma/classify-products.ts`. Şemaya (`prisma/schema.prisma`) ekleme-only 3 yeni `Product` alanı
geldi: `sourceType` (`"feed"|"scrape-cheerio"|"scrape-playwright"`), `specifications Json?`,
`rawDescription String?` — henüz hiçbir adapter bunları doldurmuyor (Faz 3'te LLM etiketleme
zenginleştirilirken devreye girecek), migration `20260804010634_add_source_fields` uygulandı.
Yeni site eklemek artık `prisma/sources/adapters/` altına `SourceAdapter` arayüzüne uyan tek bir
dosya yazıp `registry.ts`'e eklemekten ibaret. Feed/XML tabanlı bir kanıt-of-concept adapter
**bilinçli olarak eklenmedi** — gerçek bir affiliate/feed erişimi (URL/API key) gerektiriyor,
kullanıcı henüz böyle bir kayda sahip değil, ileride gerçek erişim olduğunda eklenecek.

**Önemli olay — veri kaybı ve düzeltilen güvenlik açığı:** Yeni mimariyi doğrulamak için
`TY_SMOKE_TEST=1 npx tsx prisma/sources/run.ts` gerçek (tek/canlı) `dev.db`'ye karşı çalıştırıldı.
O sırada Amazon.com.tr istekleri **HTTP 503** ile engelliyordu (muhtemelen önceki yoğun
taramalardan tetiklenen geçici bot-koruması — `curl` ile doğrulandı, mimariyle ilgisi yok).
Amazon adapter'ı bu yüzden 0 ürün döndürdü, ve hem eski hem yeni koddaki "bu turda görülmeyen eski
ürünleri sil" mantığı bunu "artık hiç Amazon ürünü yok" sanıp **1791 Amazon ürününü sildi**.
Kontrol edildi: CartItem/OrderItem/ProductLike/ProductComment hepsi 0 idi, yani gerçek kullanıcı
verisi kaybolmadı — sadece scrape edilmiş katalog satırları gitti (Amazon engeli kalkınca yeniden
taranıp geri gelebilir). Bu, orijinal script'lerden miras kalan bir tasarım açığıydı (aynı
davranış refactor öncesinde de vardı, sadece bu koşuda tetiklendi). **Düzeltme**: `run.ts`'e bir
güvenlik freni eklendi — bir adapter'ın bu turda upsert ettiği ürün sayısı 0 ise (muhtemelen
engellenmiş/başarısız olmuş demektir), o kaynağın stale-delete adımı **atlanıyor**, sadece uyarı
logluyor; böylece geçici bir site engeli artık tüm kataloğu silemiyor. Amazon hâlâ 503 veriyor
(en son `curl` testinde de doğrulandı) — tekrar tekrar denemek engeli uzatabileceğinden bilinçli
olarak beklendi, tekrar denenmedi.
Doğrulama: `npx tsc --noEmit` temiz (hem migration sonrası hem run.ts düzeltmesi sonrası).
Trendyol adapter'ı smoke test'te sorunsuz çalıştı (19 ürün, 2 sorguluk `TY_SMOKE_TEST=1`
kapsamında). **Amazon kataloğu henüz geri doldurulmadı** — bir sonraki adımda (Amazon engeli
kalktıktan sonra, ideal olarak birkaç saat/gün beklenip) `npm run products:refresh` tam koşusu
tetiklenip 1791 ürünün geri geldiği DB'den doğrulanmalı. Faz 2 (yeni site adapter'ları eklemek) ve
Faz 3 (LLM etiketlemeyi `rawDescription`/`specifications` ile zenginleştirmek) henüz başlamadı.
Faz 4 (production hosting/AWS kararı) için onaylanmış plan: Railway/Fly.io + yönetilen Postgres
varsayılan öneri, AWS EC2+RDS sadece kullanıcı özellikle AWS istiyorsa alternatif — henüz
uygulanmadı, tam plan `.claude/plans/` altında saklı değil (kullanıcının Claude Code plan
dosyasında, bu proje deposunun dışında).

## Durum: classify-products.ts gerçek Groq LLM'e geçirildi (2026-08-03)
Kullanıcı `.env`'e gerçek bir `GROQ_API_KEY` ekledi. `prisma/classify-products.ts`
tamamen yeniden yazıldı: artık `aiSummary` alanı boş olan (henüz sınıflandırılmamış)
ürünleri 15'lik gruplar hâlinde Groq'a (`llama-3.3-70b-versatile`, `response_format:
json_object`) gönderip fabric/season/tags/aiSummary üretiyor — GROQ_API_KEY yoksa
veya bir grup için çağrı başarısız olursa (429 rate limit'te 3 kez exponential
backoff ile yeniden dener, başka hatalarda direkt) o ürünler eski regex/anahtar-kelime
yöntemine düşüyor, yani script hiçbir ürünü etiketsiz bırakmıyor. **Önemli
zorunluluk:** Groq'un `json_object` response_format'ı, mesajlardan birinde LİTERAL
"json" kelimesi geçmezse `400 'messages' must contain the word 'json'...` hatası
veriyor — ilk denemede bu hataya çarpıldı (prompt "şemayla" diyordu ama "JSON"
kelimesi hiç geçmiyordu), "Yanıtını JSON formatında ver" eklenince düzeldi. Sadece
YENİ/etiketlenmemiş ürünler işlenir (her 6 saatlik refresh'te binlerce değişmemiş
ürünü tekrar LLM'e göndermemek için) — tüm kataloğu zorla yeniden etiketlemek için
`FORCE_RECLASSIFY=1 npx tsx prisma/classify-products.ts`.
Doğrulama: 20 ürünlük gerçek bir LLM koşusu yapıldı, DB'den örnek satırlar elle
kontrol edildi (gerçek fabric/season/tags/aiSummary, örn. "Columbia Fast Trek II
Kadın Sweatshirt" → fabric:"Polyester", season:"Kış", tags içinde "sıcak tutar,
kalın, spor" gibi LLM-üretimi etiketler). Ardından kalan ~1795 etiketsiz ürün için
tam koşu arka planda başlatıldı — sonucu (kaç ürün LLM'le/kaç tanesi regex yedeğiyle
etiketlendi) bir sonraki adımda kontrol edilmeli.

## Önceki durum: Otomasyon görevi hiç çalışmamış bulundu ve düzeltildi (2026-08-03)
Kullanıcı "sürekli veri çeken, etiketleyen bir otomasyon kur" dedi. İki önemli bulgu:
(1) `classify-products.ts` **LLM DEĞİL** — tamamen regex/anahtar-kelime tabanlı kumaş/
mevsim/kesim etiketleme. Gerçek LLM tabanlı etiketleme için `GROQ_API_KEY` gerekiyor,
hâlâ `.env`'de boş; kullanıcı şimdilik regex'in kalmasını, key'i sonra eklemesini
tercih etti (bkz. "Bilinen eksik"). (2) Önceki oturumda kurulan "TrendAI Urun Yenile"
Task Scheduler görevi **hiç ateşlenmemişti** (`LastRunTime` 1999 sentinel değeri,
sonuç kodu "henüz çalışmadı") — muhtemelen StartBoundary'den sonra makine kilitliyken
kaçırılan tetiklemeyi telafi eden bir ayar yoktu. Görev silinip yeniden kuruldu:
`RepetitionDuration` artık 3650 gün (öncesi hatalı `[TimeSpan]::MaxValue` denemesi
`P99999999DT23H59M59S` hatası verdi, günlere sınırlı makul bir değer kullanıldı),
`-StartWhenAvailable` eklendi (kaçırılan tetiklemeyi oturum açılınca telafi eder),
`-MultipleInstances IgnoreNew` + `-RestartCount 2/-RestartInterval 10dk` eklendi.
**Önemli sınır:** görevi "oturum açık olmasa da çalışsın" (S4U logon) yapmayı denedim
ama bu non-interactive PowerShell shell yükseltilmiş (elevated/admin) yetkiyle
çalışmadığı için `Register-ScheduledTask` "Erişim engellendi" hatası verdi — S4U/
Highest RunLevel için "Log on as a batch job" hakkının admin tarafından verilmesi
gerekiyor. Kullanıcı bunu istedi ama ben shell yetkisizliği nedeniyle kuramadım;
görev hâlâ **LogonType Interactive** (sadece kullanıcı oturum açıkken tetiklenir).
Gerçek arka plan (oturum kapalıyken de) çalışması isteniyorsa kullanıcının kendisi
Task Scheduler GUI'yi yönetici olarak açıp görevin Genel sekmesinde "Kullanıcı oturum
açmış olsun ya da olmasın çalıştır" seçeneğini işaretleyip Windows şifresini girmesi
gerekiyor (bu adım şifre istediği için otomatikleştirilemez).
Doğrulama: yeniden kurulan görev `Start-ScheduledTask` ile manuel tetiklendi, gerçek
zamanlı log (`%TEMP%\trendai-refresh.log`) ve aktif `node`/`cmd` süreçleri ile 49
sorgunun gerçekten koştuğu doğrulandı (LastTaskResult `267009` = "çalışıyor").
**Tam koşunun (Amazon+Trendyol+classify, tahmini 15-30dk) sonucu bu oturumda
görülmedi** — bir sonraki oturumda log'un sonu ve ürün sayısı kontrol edilmeli.

## Önceki durum: Trendyol scraping Playwright ile eklendi, Cloudflare aşıldı (2026-08-03)
Kullanıcı "internetteki tüm ürünleri tarayan, etiketleyen, sürekli güncellenen" bir
sistem hedefliyor, giyimden başlayıp kademeli genişletecek. İlk somut adım: önceden
Cloudflare bot koruması nedeniyle atlanan Trendyol'a tekrar bakıldı. Plain
`fetch`/cheerio hâlâ 403 dönüyor ama **gerçek bir headless tarayıcı (Playwright/
Chromium) Cloudflare'i sorunsuz geçiyor** — `npx playwright install chromium` ile
tarayıcı ikili dosyaları indirildi (`devDependencies`'e `playwright` eklendi). Yeni
`prisma/scrape-trendyol.ts` yazıldı: `prisma/scrape-products.ts`'teki `CATEGORIES`
listesini (artık `export` edilmiş, 49 sorgu) tekrar kullanıyor, her sorgu için
`https://www.trendyol.com/sr?q=...&pi=N` sayfasına gidip `a.product-card` elemanlarını
(`img.image`'dan ad/görsel, `[data-testid='price-value']`'dan fiyat) `page.evaluate()`
ile DOM'dan çekiyor, `Product` tablosuna `id: tyol-<trendyolId>`, `sourceSite:
"Trendyol"` ile upsert ediyor, turda görülmeyen eski Trendyol ürünlerini temizliyor
(Amazon script'iyle aynı desen). `scrape-products.ts`'in `main()`'i artık
`require.main === module` ile korunuyor (Trendyol script'i `CATEGORIES`'i import
ederken yan etki olarak Amazon scraper'ının tetiklenmemesi için). `MAX_PAGES_PER_QUERY=2`
(Playwright fetch'ten çok daha yavaş, tam 49x4 sayfa çok uzun sürerdi). Test için
`TY_SMOKE_TEST=1` env değişkeni `CATEGORIES`'i ilk 2 sorguyla sınırlıyor.
`package.json`'daki `products:refresh` artık `scrape-products.ts && scrape-trendyol.ts
&& classify-products.ts` zincirliyor — yani hem otomatik (Task Scheduler, 6 saatte bir)
hem manuel (`npm run products:refresh`) çalıştırmalar artık Trendyol'u da dahil ediyor.
Doğrulama: `npx tsc --noEmit` temiz. `TY_SMOKE_TEST=1` ile 2 sorguluk gerçek bir koşu
yapıldı (26 ürün, `sourceSite:"Trendyol"`, gerçek TL fiyat/görsel/link ile DB'ye yazıldı,
örnek satırlar elle doğrulandı). **49 sorgunun TAMAMIYLA gerçek bir tam koşu HENÜZ
yapılmadı** — smoke test oranına göre tahmini süre 15-30 dakika + Playwright'ın Amazon
script'inden çok daha yavaş olması (her sorgu için yeni browser context + ~2.5sn
sayfa bekleme x 2 sayfa). İlk tam koşuda Trendyol'un yüksek hacimde bot koruması
tetikleyip tetiklemeyeceği (rate limit, CAPTCHA) bilinmiyor — headless olduğu ve
istekler arası bekleme (context başı 1.5sn, sorgu başı 2sn) eklendiği için düşük risk
bekleniyor ama doğrulanmadı. Bir sonraki adım: kullanıcı onaylarsa tam koşuyu tetikle
(`npm run products:refresh`, uzun sürebileceği için arka planda) ve log/ürün sayısını
kontrol et.

## Önceki durum: Sidebar sekmeleri arası geçiş hızlandırıldı (2026-08-03)
Kullanıcı sekmeler (sol menüdeki Ana sayfa/Sohbet/Keşfet/Bildirimler/Mesajlar/Geçmiş/Sepet)
arası geçişin yavaş olduğunu bildirdi. Kök neden: `next.config.ts`'de `staleTimes.dynamic`
ayarlanmamıştı, Next 15+'te bu varsayılan 0 saniye — yani bu sayfaların hepsi `auth()`
(cookie okuduğu için dinamik) kullandığından her sekme tıklamasında client-side cache
DEVREDE DEĞİLDİ, her tıklama tam bir server round-trip'e gidiyordu. Ayrıca hiçbir route'ta
`loading.tsx` yoktu, yani Next bu dinamik sayfalar için prefetch/anlık yükleme state'i de
sağlayamıyordu (tıklama ekran donmuş gibi hissettiriyordu). İki düzeltme: (1)
`next.config.ts`'e `experimental.staleTimes: {dynamic: 30, static: 180}` eklendi — bir
sekmeye 30sn içinde tekrar dönmek artık cache'den anında geliyor; (2) 7 sekme route'unun
her birine (`(main)/`, `chat/`, `explore/`, `activity/`, `messages/`, `history/`, `cart/`)
paylaşılan `src/components/layout/page-loading.tsx` (basit `Loader2` spinner) kullanan bir
`loading.tsx` eklendi — artık tıklama anında spinner gösteriyor, boş/donmuş ekran yok.
`(main)/layout.tsx`'teki paylaşılan shell (auth+unread sayıları) zaten Next'in "shared
layout sekmeler arası yeniden fetch edilmez, sadece değişen page segment'i" davranışı
sayesinde her sekmede tekrar çalışmıyordu (dokümantasyondan doğrulandı) — sorun oradan
kaynaklanmıyordu, sadece page-level dynamic caching ve loading state eksikliğiydi.
Doğrulama: `npx tsc --noEmit` temiz, dev server yeniden başlatıldı (config değişikliği
restart gerektiriyor), log'da `Experiments (use with caution): staleTimes` aktif göründü,
curl ile ana sekme route'ları 307 (auth redirect, beklenen) döndü. **Tarayıcıda gerçek
kullanıcı olarak "hissedilen hız" test edilmedi** — kullanıcının bizzat kontrol etmesi
gerekiyor; hâlâ yavaşsa bir sonraki şüpheli nokta explore/messages gibi sayfalardaki ağır
Prisma sorguları olurdu.

## Önceki durum: Katalog giyim ağırlıklı 49 sorguya genişletildi, Trendyol bilinçli olarak atlandı (2026-08-03)
Kullanıcı "daha fazla ürün, giyime odaklan" dedi ve Trendyol için Cloudflare bot
korumasını aşma seçenekleri (Playwright headless-browser, ücretli Apify scraper API)
sunuldu — kullanıcı ikisini de istemedi, karmaşıklık/maliyet/ToS riski nedeniyle
**Trendyol şimdilik tamamen atlandı**, sadece Amazon.com.tr büyütüldü (bkz. bir
altındaki "Önceki durum" girdisi — oradaki 24 sorguluk taban değişmedi, üstüne 25
yeni giyim alt-kategorisi eklendi: hırka, yelek, trençkot/kaban, kot ceket/pantolon,
triko kazak, büyük beden tişört/elbise, spor tişört, gece elbisesi, takım elbise,
jile, sweatshirt/kapüşonlu — toplam **49 sorgu**). Mevcut giyim-dışı kategoriler
(ayakkabı, çanta/aksesuar, çorap, şapka) kullanıcı isteğiyle KALDIRILMADI, olduğu
gibi duruyor. Trendyol resmi Marketplace API'si (`developers.trendyol.com`) ve
Affiliate programı araştırıldı — ikisi de bizim amacımıza uygun değil: Marketplace
API satıcıların KENDİ ürünlerini yönetmesi için (üçüncü taraf katalog taraması için
değil), Affiliate programı ise 30k Instagram/10k TikTok takipçi şartı + toplu ürün
feed'i sunmuyor (sadece paylaşım linki). Yani Trendyol için gerçekçi tek yol hâlâ
Cloudflare bypass (headless browser veya ücretli 3.parti API) — kullanıcı onaylarsa
ileride eklenebilir.
Doğrulama: `npx tsc --noEmit` temiz, `node -e` ile dosyadaki toplam `query:` sayısı
49 olarak doğrulandı. **49 sorgulu genişletilmiş scraper'ın gerçek bir tam koşusu
HENÜZ yapılmadı** — tahmini süre 15-25 dakika (sayfa/istek başı bekleme nedeniyle),
Amazon'un bu hacimde bot koruması tetikleyip tetiklemeyeceği bilinmiyor. İlk
otomatik (Task Scheduler, 6 saatte bir) veya manuel (`npm run products:refresh`)
çalıştırmadan sonra log ve ürün sayısı kontrol edilmeli.

## Önceki durum: Ürün kataloğu düzenli otomatik yenileniyor (2026-08-03)
`prisma/scrape-products.ts` genişletildi: 8 sabit kategori/120 ürün yerine artık 24
sorgu (cinsiyet ayrılmış tişört/elbise/ceket/pantolon/ayakkabı/kazak/gömlek/şort/etek/
mont/bluz/eşofman/tayt/çorap/aksesuar), her sorgu için Amazon arama sonuçlarında
sayfalama (`MAX_PAGES_PER_QUERY=4`, sayfa başına ~40 ürüne kadar) eklendi — potansiyel
katalog boyutu ~1000+ ürüne çıktı. Script artık sonunda o turda hiç görülmeyen eski
Amazon ürünlerini (`sourceSite:"Amazon"`, `id: {notIn: seenIds}`) `deleteMany` ile
temizliyor, yani kalkan/artık bulunamayan ürünler DB'de birikmiyor. Yeni npm script:
`npm run products:refresh` (scrape + `classify-products.ts` etiketleme zincirlemesi).
Windows Task Scheduler'a "TrendAI Urun Yenile" adında, her 6 saatte bir bu scripti
çalıştıran bir görev kaydedildi (`Register-ScheduledTask`, kullanıcı bağlamında,
loglar `%TEMP%\trendai-refresh.log`'a yazılıyor) — böylece katalog artık manuel
tetiklemeye gerek kalmadan kendiliğinden tazeleniyor. `src/` tarafında hiçbir okuma
yolu (`explore`, `recommendations`, `groq.ts`'deki `findCandidateProducts`, product
detay sayfası) değişmedi — hepsi hâlâ local Prisma `Product` tablosundan okuyor,
sadece bu tablonun İÇERİĞİ artık düzenli/daha geniş kapsamda yenileniyor.
Doğrulama: `npx tsc --noEmit` temiz. Görev Zamanlayıcı görevi `Get-ScheduledTask` ile
"Ready" durumunda doğrulandı. **Genişletilmiş scraper'ın gerçek bir tam koşusu HENÜZ
yapılmadı** (24 sorgu x 4 sayfa Amazon'a çok sayıda istek anlamına geliyor, süre ve
bot-koruması riski nedeniyle bu oturumda tetiklenmedi) — ilk otomatik/manuel
çalıştırmada log dosyasını ve ürün sayısını kontrol etmek gerekiyor.

## Önceki durum: DESIGN.md editorial tema uygulandı (2026-08-03)
Kullanıcının verdiği bir stil referansına (LUNCH — parşömen zemin, ink-black
çizgiler, lavanta `#b8aad0` vurgu, 0px radius, Good Sans/Redaction tipografi)
göre görsel sistem yeniden temellendirildi: `src/app/globals.css`'teki CSS
değişkenleri (`--background`, `--primary`, `--accent`, vb.) mavi/mor paletten
parşömen/siyah/lavanta paletine geçirildi; `src/app/layout.tsx`'te Geist yerine
Inter (`--font-good-sans`) + Fraunces (`--font-redaction`, sadece marka
wordmark'ı için) next/font ile kuruldu. Paylaşılan `src/components/ui/*`
primitiflerinde (`button`, `card`, `input`, `tabs`, `dropdown-menu`, `tooltip`)
`rounded-lg/xl/md` → `rounded-none` yapıldı (Avatar kasıtlı olarak `rounded-full`
bırakıldı — fonksiyonel yuvarlaklık). `main-shell.tsx`'teki sol menü kullanıcı
isteği üzerine (ikonlar SİLİNMEDİ, sadece stil değişti) pill/bg-muted aktif
state yerine ince sol kenarlık (`border-l-2`) + büyük harf/tracking-wide etiket
stiline geçirildi, marka adı `--font-redaction` ile render ediliyor. Explore
grid'i (`explore-grid.tsx`) DESIGN.md'deki "flush, 5px gap, 0 radius" ürün
galerisi spesifikasyonuna göre güncellendi. Diğer sayfalar bu paylaşılan
primitifleri/tokenleri tükettiği için otomatik olarak yeni temaya geçti; her
sayfa tek tek satır satır düzenlenmedi.
Doğrulama: `npx tsc --noEmit` temiz. **Önemli bulgu:** dev server'ı yeniden
başlatmak (hatta `.next` silmeden) globals.css'teki DEĞİŞEN (yeni class değil,
var olan bir dosyadaki değişen literal CSS custom property değerleri) içeriği
derlenmiş CSS'e YANSITMADI — üç farklı restart denemesinde de derlenmiş
`layout.css` eski `#3b82f6` değerini döndürmeye devam etti. Sorunu çözen tek şey
server'ı durdurup (+ orphan node.exe'yi `taskkill //F` ile öldürüp) `.next`
klasörünü TAMAMEN silip temiz başlatmaktı — sonrasında derlenmiş CSS'te yeni
renkler doğrulandı. Yani bilinen ".next silme, sadece Turbopack/yeni Tailwind
class sorunu değil" — webpack persistent cache bazen var olan bir CSS
dosyasındaki DEĞİŞEN değerleri de fark etmiyor bu proje yolunda; şüpheli
davranış görülürse curl ile derlenmiş CSS içeriğini DOM'a değil dosyaya karşı
doğrula.
Yapılmadı: DESIGN.md'deki "3D chrome hero wordmark" ve full-bleed editorial hero
bölümü bu sosyal/feed uygulamasına uygulanmadı (TrendAI'de böyle bir hero yok,
kapsam dışı bırakıldı). Tarayıcıda görsel/screenshot karşılaştırması yapılmadı.

## Önceki durum: AI arama örtük/bağlamsal kısıtları anlıyor (2026-08-02)
`src/lib/groq.ts`'deki `searchProducts` artık tek LLM çağrısı yerine 3 aşamalı:
(1) yeni `extractSearchIntent()` — sohbet metnindeki fiziksel/bağlamsal kısıtları
(örn. "düğünde giyeceğim, rüzgarlı olacak, uçmasın" → geniş etek/uçuşan kumaştan
kaçın, dar kesim tercih et) modelin dünya bilgisiyle `{mustHaveKeywords,
avoidKeywords, reasoning}` JSON'ına çıkarır (sabit sözlük değil, LLM tabanlı —
genellenebilir); (2) `findCandidateProducts` bu keyword'lerle aday havuzunu
puanlar/filtreler (avoid eşleşenler havuzdan çıkar, havuzu tamamen boşaltırsa
dürüstçe filtresiz devam eder — cinsiyet filtresindeki mevcut desenle aynı) ve
havuzu 8'den 20'ye çıkarır; (3) mevcut seçim çağrısının promptu artık
`suitabilityExplanation`'ı jenerik değil, somut fiziksel/bağlamsal gerekçeyle
yazmaya yönlendiriliyor. `GROQ_API_KEY` yoksa 1. aşama atlanır, eski keyword-only
davranış korunur. Ayrıca `prisma/classify-products.ts`'e ürün başlığından
kesim/silüet etiketi (kalem kesim, dar kesim, salaş, pileli, şifon, streç,
mini/midi/maxi) çıkaran bir katman eklendi ve DB'deki 120 ürün üzerinde
çalıştırılıp `tags` alanı güncellendi.
Doğrulama: `npx tsc --noEmit` temiz, script çalıştırıldı (120 ürün güncellendi,
DB'den örnek satırlarda yeni mini/midi/maxi etiketleri görüldü). `GROQ_API_KEY`
hâlâ boş olduğu için yeni LLM niyet-çıkarım aşaması gerçek bir key ile uçtan uca
test edilmedi — sadece kodun fallback yoluyla (keyword-only, eski davranış)
regresyona yol açmadığı doğrulandı.

## Önceki durum: Gerçek veri + Google OAuth + kaynak siteye yönlendirme (2026-08-02)
Önceki 9 fazlık plan tamamlanmıştı; bu turda şunlar eklendi: Google ile giriş, sahte
seed kullanıcılarının/ürünlerinin kaldırılması, Amazon.com.tr'den gerçek ürün scraping,
TL (₺) fiyat gösterimi, checkout/ödeme akışının kaldırılması (sepet artık sadece
"saklama" — ödeme yok), sepet/AI-öneri tıklamalarının ürünün gerçek satıldığı siteye
(Trendyol/Amazon) yönlendirilmesi, ve sol menüdeki titreme bugunun düzeltilmesi.
Doğrulama: `npx tsc --noEmit` temiz, `npm run lint` temiz, gerçek signup akışı curl ile
test edildi (201, kullanıcı db'de gerçekten oluştu), auth-korumalı route'lar 307
redirect veriyor.

## Kurulan özellikler
- Auth: `/login`, `/signup`, `/forgot-password`, NextAuth Credentials+bcrypt + **Google OAuth**,
  `src/proxy.ts` route koruması. Google girişi çalışması için `.env`'e `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET` girilmesi gerekiyor (bkz. "Bilinen eksik").
- Ana sayfa (`(main)/page.tsx`): story reel, feed (PostCard, beğeni/kaydetme optimistic UI), "Senin için önerilenler".
- AI arama: `/chat`, `/api/chat`, `src/lib/groq.ts` — `GROQ_API_KEY` yoksa otomatik yerel substring fallback'e düşer.
  Sohbetten örtük/bağlamsal kısıtları (`extractSearchIntent`) çıkarıp aday havuzunu buna göre
  daraltıyor (bkz. yukarıdaki "Durum" bölümü). Önerilen ürüne tıklamak artık `/product/[id]`'e
  değil, doğrudan ürünün `sourceUrl`'üne (Amazon sayfası) gidiyor.
- Geçmiş aramalar: `/history` (SearchHistory tablosu).
- Ticaret: `/product/[id]` (TL fiyat + "Sepete Ekle" + "{site}'da görüntüle" dış link), `/cart`
  (sadece saklama, ödeme YOK — ürüne tıklamak kaynak siteye götürür). `checkout/*` route'ları
  ve `placeOrder`/`saveAddress` action'ları tamamen kaldırıldı (yasal olmadığı için ödeme akışı yok).
- Ürün verisi: `prisma/scrape-products.ts` — Amazon.com.tr arama sonuçlarından (cheerio ile)
  gerçek ürün adı/TL fiyatı/görsel/link çeker, `Product.sourceSite="Amazon"` + `sourceUrl` ile kaydeder.
  Trendyol Cloudflare bot koruması arkasında (403 "Just a moment...") — denenmedi/eklenmedi.
  Manuel çalıştırmak için: `npm run products:refresh` (24 sorgu x sayfalama, artık eski
  ürünleri de temizliyor). Ayrıca Windows Task Scheduler'da "TrendAI Urun Yenile" görevi
  bunu her 6 saatte bir otomatik çalıştırıyor (bkz. yukarıdaki "Durum" bölümü).
- Sosyal: `/explore`, `/messages` + `/messages/[id]`, `/saved`, `/activity`, `/profile/[username]`.
- Ayarlar: `/settings/profile`, `/settings/privacy`.

## Bilinen eksik / yapılacak
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` henüz `.env`'de boş — kullanıcı
  console.cloud.google.com/apis/credentials'tan bir "OAuth client ID" (Web application)
  oluşturup doldurmalı. Redirect URI: `http://localhost:3000/api/auth/callback/google`.
  Doldurulana kadar "Google ile giriş yap" butonu hata verir.
- Kullanıcı henüz gerçek bir `GROQ_API_KEY` eklemedi (`.env` içinde boş) — https://console.groq.com/keys
  adresinden ücretsiz key alınıp eklenmeli; eklenene kadar AI arama yerel fallback'te çalışıyor.
- Sadece HTTP/curl seviyesinde doğrulama yapıldı; tarayıcıda görsel/screenshot karşılaştırması yapılmadı.
- Sahte test kullanıcıları kaldırıldı — db şu an boş, kullanıcı kendi hesaplarını `/signup`
  veya Google ile oluşturmalı. Eski `maybeno@trendai.dev` girişi ARTIK GEÇERSİZ.
- Order/Address/OrderItem Prisma modelleri şemada duruyor (kullanılmıyor, checkout kaldırıldığı
  için) — ileride gerçek bir ödeme akışı eklenirse kullanılabilir, yoksa temizlenebilir.

## Önemli ders / tuzaklar
- `.next` klasörünü dev server çalışırken SİLME — cache'i bozup 500 hatalarına yol açar.
  Önce server'ı durdur, sonra sil.
- `src/app/page.tsx` (create-next-app boilerplate) ile `(main)/page.tsx` aynı "/" route'unda
  çakışabilir — sadece biri olmalı.
- **Turbopack proje yolundaki "Masaüstü" (Türkçe ü) karakterinde çöküyor**
  (`start byte index 24 is not a char boundary; it is inside 'ü'` — Rust panic, turbopack-core/ident.rs).
  Bu yüzden `package.json`'daki `dev` scripti `next dev --webpack` olarak ayarlandı (Turbopack yerine
  webpack kullanılıyor). Bunu Turbopack'e geri döndürme — proje klasörü ASCII olmayan karakter içeren
  bir yoldan (OneDrive\Documents\Masaüstü\...) taşınmadıkça tekrar çökecektir.
- `next.config.ts`'de `outputFileTracingRoot: path.join(__dirname)` ayarlandı — `C:\Users\VICTUS`
  altındaki başka bir `package-lock.json` yüzünden Next'in yanlış workspace-root algılamasını önler.
- Aynı anda birden fazla `npm run dev` süreci çalıştırmaktan kaçın — ikisi de `.next` klasörüne
  yazınca webpack modül önbelleği bozulup `__webpack_modules__[moduleId] is not a function` hatası verir.
  Yeni bir dev server başlatmadan önce eski PID'nin gerçekten öldüğünü `netstat -ano | grep LISTENING`
  ile doğrula (TaskStop harness takibini durdurur ama OS sürecini her zaman öldürmeyebilir — gerekirse
  `taskkill //F //PID <pid>`).
- **"npm run dev" arka plan görevi "failed" görünse de asıl sunucu genelde hâlâ ayakta olabilir.**
  Windows'ta `npm run dev` bir npm wrapper süreci başlatıyor; wrapper süreci (ve onu izleyen bash görevi)
  sonlansa/"failed" raporlansa bile alttaki gerçek `next-server` çocuk süreci bazen orphan olarak port
  3000'de çalışmaya devam ediyor. Yeni bir "npm run dev" denemeden önce MUTLAKA
  `netstat -ano | grep LISTENING` ile portun zaten dolu olup olmadığını ve `curl` ile sunucunun zaten
  sağlıklı yanıt verip vermediğini kontrol et — gereksiz yere ikinci bir server başlatmak
  "Another next dev server is already running" hatasına ve port 3001'e kaçmaya yol açar.
  (Önceden OneDrive senkronizasyonunun dosya kilitlemesi şüphelenilmişti ama asıl neden bu orphan-process
  davranışı olduğu doğrulandı.)
- **Tailwind v4'ün CSS tarayıcısı bu proje yolunda ("Masaüstü" — Türkçe ü) YENİ eklenen class
  isimlerini derlenmiş CSS'e dahil etmiyor.** Turbopack'in aynı 'ü' karakterinde çöktüğü bilinen
  soruna paralel bir durum (muhtemelen aynı Rust "oxide" tarayıcı ailesi). Somut belirti: yeni bir
  dosyada `max-w-md`, `scroll-smooth`, `py-6`, `z-10` gibi projede HİÇ kullanılmamış bir class
  ilk kez kullanıldığında, webpack HMR o class ismini DOM'a doğru şekilde yazıyor (JS tarafı
  güncelleniyor) ama `_next/static/css/app/layout.css` yeniden derlenmiyor — o class için hiçbir
  kural üretilmiyor, sessizce (hatasız) kayboluyor. Dev server'ı yeniden başlatmak da düzeltmiyor.
  Sonuç: eleman stilsiz kalıyor (örn. `max-w-md` çalışmayınca bir resim tüm ekranı kaplayıp
  "zoom" gibi görünebiliyor). **Doğrulama yöntemi:** `curl`/playwright ile derlenmiş CSS
  dosyasını çek, class'ın orada olup olmadığını `.includes()` ile kontrol et — DOM'da class
  string'inin var olması class'ın STİLLENDİĞİ anlamına gelmez. **Çözüm:** yeni/daha önce
  kullanılmamış bir Tailwind class'ı eklerken, önce derlenmiş CSS'te zaten var olan (projede
  başka yerde kullanılmış) bir class'la aynı işi görüp göremeyeceğini dene; olmuyorsa o özelliği
  (özellikle max-width, overflow, position offset, z-index, hover: gibi ilk kez kullanılan
  varyantlar) Tailwind class'ı yerine `style={{ ... }}` inline stil olarak yaz — bu tarayıcıyı
  tamamen atlar ve güvenilir çalışır. Kalıcı çözüm yine proje klasörünü ASCII yola taşımak.
- Prisma schema değiştirip `prisma generate` çalıştırmadan önce, Windows'ta zaten çalışan bir
  `next dev` süreci varsa `query_engine-windows.dll.node` dosyasını kilitler ve generate
  `EPERM: operation not permitted, rename ...` hatasıyla patlar. Devam etmeden önce kullanıcıya
  sorup dev server'ı durdurman gerekir; durdurunca TÜM ilgili node.exe süreçlerinin gerçekten
  öldüğünü doğrula (bazen kullanıcının önceden açtığı bağımsız bir server da aynı anda ölebilir —
  öyle olduysa mutlaka yeniden başlatıp kullanıcıyı bilgilendir).
