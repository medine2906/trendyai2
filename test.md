# TrendAI — Öğrenme Notları + Yol Haritası

> Bu dosya, 2026-09-15 tarihli konuşmada konuşulan tüm konuları (LLM eğitimi,
> isim değişikliği, UI yenileme, sosyal özellikler, veritabanı) tek yerde
> topluyor. Amaç: önce **sen** ne yapacağımızı anlayasın, sonra birlikte
> sırayla uygulayalım. Kodlamaya başlamadan önce aşağıdaki "Açık kararlar"
> bölümündeki soruları cevaplaman gerekiyor (bkz. en alt).

---

## 1. "LLM'i eğitmek" ne demek? (Temel eğitim)

Şu an sistem şöyle çalışıyor: kullanıcı sohbette bir şey yazıyor
(`src/lib/groq.ts`) → Groq'taki hazır `llama-3.3-70b-versatile` modeline
gönderiliyor → model, DB'deki ürünler arasından uygun olanları seçiyor.
**Hiçbir model eğitilmiyor** — hazır bir modeli "akıllıca kullanıyoruz".
Senin sorduğun soru: "rüzgarlı havada uçuşmasın" gibi bağlamsal istekleri
anlaması için ürünleri etiketleyip modele mi öğretmemiz lazım, yoksa başka
bir yöntem mi var?

Üç farklı yaklaşım var, karmaşıklık sırasına göre:

### A) Sıfırdan kendi LLM'ini eğitmek — ÖNERMİYORUM
Bir dil modelini sıfırdan eğitmek milyarlarca kelimelik veri + haftalarca
GPU kümesi (yüz binlerce dolar) gerektirir. Bizim ölçeğimizde (birkaç bin
ürün) bu hem imkansız hem gereksiz. Bu seçeneği kapatıyorum.

### B) Açık kaynak modeli "fine-tune" etmek (ince ayar)
Var olan açık bir modeli (örn. Llama 3.1 8B, Mistral 7B) kendi verinle
"ince ayar" yaparsın — yani modele binlerce örnek `(kullanıcı isteği →
doğru ürün önerisi)` çifti gösterip ağırlıklarını güncellersin. Bunun için:
- **Etiketli veri seti** gerekir: gerçek kullanıcı aramaları + hangi
  ürünün doğru cevap olduğu (elle ya da sentetik olarak üretilir).
- GPU gerekir (kiralık — RunPod, Modal, Together.ai gibi servislerden
  saatlik birkaç dolara).
- LoRA/QLoRA denen bir teknikle tüm modeli değil, küçük bir "ek katman"ı
  eğitirsin — çok daha ucuz ve hızlıdır (birkaç saat, birkaç dolar).
- **Ne zaman mantıklı**: Elinde gerçekten büyük (10.000+) gerçek kullanıcı
  etkileşimi verisi olduğunda, ve mevcut yöntem (aşağıdaki C) yetersiz
  kaldığında. Şu an için erken.

### C) Hazır LLM + "etiketleme + akıllı arama" (RAG) — ŞU AN YAPTIĞIMIZ, DOĞRU YÖNTEM
Bu, senin sorduğun "tüm ürünleri etiketlememiz mi gerekiyor" sorusunun
cevabı: **Evet, ama modeli eğitmek için değil, modele doğru seçenekleri
sunmak için.** Süreç şöyle:
1. **Etiketleme**: Her ürüne LLM ile otomatik etiketler ekliyoruz —
   kumaş, mevsim, kesim/silüet (dar/salaş/pileli), kullanım amacı vb.
   (`prisma/classify-products.ts` bunu zaten yapıyor, Groq ile).
2. **Niyet çıkarımı**: Kullanıcı "düğünde giyeceğim, rüzgarlı, uçmasın"
   dediğinde, LLM bunu `{aranacak: [...], kaçınılacak: [...]}` gibi bir
   yapıya çeviriyor (`extractSearchIntent`, zaten var).
3. **Filtreleme + seçim**: Bu yapıyla ürün havuzu daraltılıyor, sonra LLM'e
   "bu adaylardan en uygun olanları seç ve nedenini açıkla" deniyor.
   Bu "RAG" (Retrieval-Augmented Generation) denen, sektörde en yaygın
   yöntem — ChatGPT eklentileri, Amazon'un "Rufus"u vb. hep bunu kullanır.

**Bir sonraki geliştirme adımı (opsiyonel, C'yi güçlendirir)**: "embedding"
(anlam vektörü) tabanlı arama eklemek. Şu an ürün seçimi biraz kaba
(anahtar kelime + LLM'in elindeki listeye bakması). Embedding eklersen,
her ürünün açıklamasını sayısal bir vektöre çevirirsin, kullanıcı isteğini
de vektöre çevirirsin, en yakın vektörleri (anlamca en benzer ürünleri)
matematiksel olarak bulursun — anahtar kelime eşleşmesi olmasa bile
anlamca örtüşen ürünleri yakalar. Bu adımı şimdilik ertelemeyi öneriyorum;
önce mevcut yöntemin gerçek kullanıcı geri bildirimiyle nerede zorlandığını
görelim.

### Özet tavsiye
Kendi LLM'ini eğitme. Onun yerine: (1) ürün etiketlemesini derinleştir,
(2) niyet-çıkarım katmanını geliştir, (3) gerekirse ileride embedding arama
ekle. Bu, hem çok daha ucuz hem daha hızlı geliştirilebilir, hem de aynı
kaliteyi (hatta daha iyisini) verir.

---

## 2. Avatar / "üzerimde nasıl görünür" özelliği (bahsedildi, kapsam dışı bırakıldı)
Kullanıcı boy/kilo girerek ya da fotoğraftan avatar oluşturup ürünleri
üzerinde "deneme" özelliğinden bahsetti. Bu büyük ve ayrı bir özellik
(görsel üretim/virtual try-on modelleri gerektirir — ör. Google'ın
"Try-On" API'si ya da benzeri bir görsel model). **Kullanıcının kendi
isteğiyle şimdilik kapsam dışı** ("şu an AI'ye odaklanalım" dendi) — ayrı
bir plan gerektirecek, ileride ele alınacak.

---

## 3. Veri kaynağı / yasallık durumu
Kullanıcı, ürün verilerinin scrape edilmesinin (Amazon/Trendyol) yasal risk
taşıdığını, Cimri gibi sitelere lisanslı erişim için mail attıklarını
belirtti. Bu netleşene kadar:
- Mevcut scraper mimarisi (`prisma/sources/`) korunuyor, ama bilinen bir
  risk olarak not düşülüyor.
- Lisanslı bir feed/API erişimi geldiğinde (`prisma/sources/adapters/`
  altına yeni bir adapter eklemek yeterli — mimari zaten buna göre
  kuruldu), scraper'lar kademeli olarak feed'e devredilebilir.
- Şimdilik aksiyon gerekmiyor, sadece bilgi notu.

---

## 4. İsim değişikliği — "TrendAI" → ?
Sorun: "TrendAI" ismi "Trendyol" ile karışabilir / marka çağrışımı riski
taşıyabilir. Öneriler (hepsi "trend" kökünden kaçınıyor, farklı bir
çağrışım alanına gidiyor):

| İsim | Çağrışım |
|---|---|
| **Kombin AI** | Kıyafet kombinleme, Türkçe ve akılda kalıcı |
| **Giyul** | "Giy" + kısa/marka gibi |
| **Outfitto** | "Outfit" kökü, global/şirin |
| **StilMind** | "Stil" + "akıl" |
| **WearWise** | "Giymek" + "akıllı" |
| **ModaMind** | Moda + zeka |
| **Fitloop** | Kıyafet + döngü/akış (feed) |
| **Giyinsel** | "Giyin" + kişisel |

Bunlardan birini seç (ya da hiçbiri olmazsa yeni öneriler çıkarırım),
sonraki adımda `package.json`, UI metinleri, `README.md`, marka
wordmark'ı vs. içinde global bir isim değişikliği yapacağız.

---

## 5. UI yenileme — Instagram'a çok benzememeli
Şu anki tasarım (editorial/parşömen tema) zaten bir kimlik denemesi ama
genel yapı (sol menü + feed + story reel) hâlâ IG'ye çok yakın duruyor.
Plan: UI redesign fazında `refero-design`/`frontend-design` skill'lerini
kullanarak gerçek bir görsel kimlik araştırması yapıp (renk/tipografi/
layout) IG'den daha net ayrışan bir yapı kuracağız — bu, isim netleşince
yapılacak (isim + marka kimliği birlikte kurulmalı).

---

## 6. Ana sayfa — sosyal özellikler (mock data)
İstenenler:
- "Arkadaşını takip et" / önerilen kullanıcılar bölümü
- Bildirimler ("X seni takip etti" vb.)
- **Bunlar MOCK DATA olacak** — gerçek kullanıcı grafiği/algoritması değil,
  sadece görsel olarak dolu bir deneyim için sahte öneriler.

## 7. Keşfet (Explore) sayfası
- Bir gönderiye tıklayınca IG'deki gibi büyüyerek açılması (mevcut modal
  var, "büyüme" animasyonu/UX'i geliştirilecek).
- **Video desteği** — kullanıcı açıkça "şimdi değil, ileride" dedi. Bu
  fazlara video EKLENMEYECEK, sadece not düşülüyor.

## 8. Veritabanı — Supabase'e geçiş?
Şu an: Prisma + **yerel SQLite** dosyası (`dev.db`). Kullanıcı "gerçek
giriş yapanların verisi nerede duruyor, Supabase'e bağlıysa daha iyi olur"
dedi ama emin değil. Netleştirilmesi gereken: Supabase'e geçmek İSTENİYOR
mu? Bu büyük bir karar çünkü:
- Yeni bir Supabase projesi (Postgres) kurulması, `DATABASE_URL`'in
  değişmesi, mevcut SQLite verisinin taşınması (migration) gerekir.
- Prisma zaten Postgres'i destekliyor, geçiş teknik olarak kolay ama
  **geri dönüşü zor bir altyapı kararı** — bu yüzden onay bekliyorum,
  otomatik yapmıyorum.

---

## 9. Uygulama sırası (önerilen fazlar)
1. **İsim seçimi + global rebrand** (isim onaylanınca)
2. **Ürün etiketleme derinleştirme** (bkz. Bölüm 1.C) — kod değişikliği,
   risk düşük, bana onay vermene gerek yok, direkt başlarım.
3. **UI yenileme** (isim/kimlik netleştikten sonra)
4. **Ana sayfa mock sosyal özellikler** (takip önerileri, bildirimler)
5. **Explore büyüme animasyonu** (video HARİÇ)
6. *(Ayrı karar bekliyor)* Supabase migration — sadece onaylarsan

---

## Kararlar (2026-09-15'te verildi)
1. **İsim**: Kullanıcı "sadece kıyafet için değil" dedi (yukarıdaki listedeki
   isimlerin hepsi giyim çağrışımlı olduğu için hiçbirini seçmedi). Bunun
   üzerine genel/kategori-bağımsız bir isim seçildi: **ShopMind**. Uygulandı
   (bkz. CLAUDE.md'deki "İsim değişikliği" durum kaydı) — kod, UI metinleri,
   `package.json`, dokümantasyon güncellendi.
2. **Supabase**: İlk onaydan sonra kullanıcının Supabase ücretsiz hakkı
   bittiği ortaya çıktı. Alternatif olarak Google Cloud SQL denendi ama bu
   oturuma bağlı Google eklentileri sadece **Gmail/Google Calendar/Google
   Drive** — gerçek bir Google Cloud Platform (Cloud SQL/altyapı) bağlantısı
   YOK, yani otomatik bir Postgres instance'ı kuramıyorum (Supabase'de de
   aynı sınır vardı — ikisi de manuel konsol işlemi gerektiriyor). Kullanıcı
   bu bilgiyle **"şimdilik SQLite'ta kal"** dedi — bulut DB kararı
   ertelendi, kullanıcı hazır olduğunda (yeni bir Supabase hesabı, Google
   Cloud SQL manuel kurulum, ya da Neon/Railway gibi bir alternatif) tekrar
   ele alınacak.
3. **Uygulama tarzı**: Hepsi sırayla, sormadan yapılacak.

## Sıradaki adımlar
- [x] Faz 1: İsim değişikliği (TrendAI → ShopMind)
- [ ] Faz 2: Veritabanı bulut geçişi — **ERTELENDİ** (kullanıcı hazır olunca)
- [x] Faz 3: Ürün etiketleme derinleştirme (bkz. CLAUDE.md — "Ürün etiketleme
      derinleştirildi" durum kaydı; gerçek LLM ile bu ortamda test edilemedi,
      kullanıcının kendi ortamında doğrulaması gerekiyor)
- [x] Faz 4: UI yenileme — renk paleti IG'nin siyah/beyazından parşömen/terrakotaya
      geçirildi (bkz. CLAUDE.md); tarayıcıda gerçekten doğrulandı (ekran görüntüleri alındı)
- [x] Faz 5: Ana sayfa mock sosyal özellikler — sağ rail (takip önerileri + son bildirimler)
      eklendi, GERÇEK kullanıcı verisiyle çalışıyor (bkz. CLAUDE.md)
- [ ] Faz 6: Explore büyüme animasyonu (video HARİÇ — kullanıcı "şimdi değil" dedi)

## ÖNEMLİ: "SQLite'ta kal" kararı gerçekte uygulanamıyor
Bu oturumda keşfedildi: `prisma/schema.prisma` bu repoda zaten `provider = "postgresql"` —
yani gerçekte kalınabilecek bir SQLite modu yok, uygulamanın çalışması için MUTLAKA gerçek
bir Postgres `DATABASE_URL` gerekiyor (Supabase/Google Cloud SQL/Neon/Railway/başka biri).
"Şimdilik SQLite'ta kal" kararı bu bilgi olmadan verildi — kullanıcıya tekrar sorulmalı.
