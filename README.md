# 🎬 CineAI - Akıllı Film & Dizi Tavsiye Asistanı (PWA)

Bu proje, n8n iş akışınızda (`FilmlerAPiKeysiz.json`) yer alan tüm filtreleme, Bayes puanlama, kullanıcı zevk eşleştirme ve Google Gemini yapay zeka tavsiye mantıklarını bünyesinde toplayan; **n8n sunucusuna ve PostgreSQL veritabanına ihtiyaç bırakmayan, tamamen bağımsız ve sıfır maliyetli modern bir web/PWA uygulamasıdır**.

---

## 🚀 Öne Çıkan Özellikler & n8n Dönüşümü

| n8n Bileşeni | Web Uygulaması Karşılığı | Açıklama |
| :--- | :--- | :--- |
| **Form Trigger** | `FilterBar.jsx` | Yaş grupları, türler, min. IMDb puanı slider'ı, Türkiye platformları çoklu seçimi, tarih aralığı, sıralama ve AI aç/kapat düğmesi. |
| **LookUp & TMDB** | `apiService.js` | TMDB `discover` ve `search` uç noktaları, Türkiye bölgesi (`watch_region=TR`) ve yayın hakları filtrelemesi. |
| **OMDb Request** | `apiService.js` | Resmi IMDb oy sayıları, hassas puanlar ve MPAA derecelendirmeleri (G, PG, PG-13, 18+). |
| **TekeDusur (Bayes Skoru)** | `scoringService.js` | `(v / (v + esik)) * R + (esik / (v + esik)) * C` Bayes ağırlıklı formülüyle oy sayısı yüksek ve güvenilir içerikleri öne çıkarır. |
| **Benzerlik Skoru & Postgres** | `storageService.js` | PostgreSQL gerektirmeden tarayıcı yerel hafızasında (localStorage) geçmiş arama ve favori türlerini tutar; **Jaccard benzerliği** (`kesisim / birlesim`) ile kişisel zevk uyum yüzdesi hesaplar. |
| **Gemini AI Agent** | `geminiService.js` | Filtrelenen en iyi adayları analiz edip samimi aile yorumu, platform bilgisi ve karşılaştırmalı tavsiye raporu üretir. |
| **Telegram Çıktısı** | `AiRecommendationModal.jsx` | Tek tıkla Telegram HTML formatında kopyalama veya normal metin kopyalama butonları. |

---

## 📱 PWA (Progressive Web App) Desteği

Uygulama tam teşekküllü bir **PWA** olarak yapılandırılmıştır:
- **iPhone / iPad (Safari):** Tarayıcıda açıp **Paylaş** -> **"Ana Ekrana Ekle"** seçeneğine dokunduğunuzda uygulama ikonuyla, adres çubuğu olmadan tam ekran mobil uygulama olarak çalışır.
- **Android (Chrome):** Menüden **"Uygulamayı Yükle"** seçeneğini seçebilirsiniz.
- **Masaüstü & Akıllı TV:** TV tarayıcısından veya bilgisayardan açıp koltuğunuzdan rahatça film seçebilirsiniz.

---

## 🛠️ Nasıl Çalıştırılır?

Proje dizinine gidin:
```bash
cd /Users/duygu_mac/Projects/film-asistani
```

Geliştirme sunucusunu başlatın:
```bash
npm run dev
```
Tarayıcınızda açın: **`http://localhost:5173`** (veya terminalde belirtilen port).

---

## 🌐 Sıfır Maliyetli Canlıya Alma (Vercel / Netlify / GitHub Pages)

Üretim derlemesi oluşturmak için:
```bash
npm run build
```
Oluşan `dist/` klasörünü:
1. **Vercel:** `npx vercel` komutuyla veya GitHub'a pushlayarak tek tıkla bağlayabilirsiniz.
2. **Netlify:** `dist` klasörünü doğrudan [Netlify Drop](https://app.netlify.com/drop) sayfasına sürükleyip bırakabilirsiniz.
3. Sunucu veya veritabanı kiralama maliyeti yoktur, 7/24 ücretsiz çalışır.

---

## ⚙️ API Anahtarları (İsteğe Bağlı)

Uygulama ilk açılışta zengin **Örnek Veri Havuzu (Demo Modu)** ile birlikte gelir; API anahtarı girmeden tüm arayüzü, filtreleri ve tavsiye motorunu hemen test edebilirsiniz. Canlı verilere geçmek istediğinizde sağ üstteki dişli çark (**Ayarlar**) menüsünden:
- **TMDB API Key:** [themoviedb.org](https://www.themoviedb.org/settings/api) üzerinden 1 dakikada ücretsiz alınabilir.
- **Google Gemini API Key:** [Google AI Studio](https://aistudio.google.com/app/apikey) üzerinden ücretsiz alınabilir.
- **OMDb API Key:** [omdbapi.com](https://www.omdbapi.com/apikey.aspx) (Opsiyonel).
