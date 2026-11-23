// Gemini AI Recommendation Service: Direct REST API & Smart Fallback Engine
import { getSettings } from './storageService';
import { getAgeRatingInfo } from '../constants/options';

const GEMINI_SYSTEM_INSTRUCTION = `Sen bir aile ve sinema film/dizi öneri asistanısın. Sana JSON formatında filtrelenmiş bir aday listesi verilecek.

Görevin:
1. Listeden en uygun 2-3 içeriği seç.
2. Her biri için kısa, samimi bir "yorum" yaz — neden uygun olduğunu, puanının ne kadar güvenilir olduğunu (oy sayısına bakarak: az oylu yüksek puanlara şüpheyle yaklaş), hangi platformda izlenebileceğini belirt.
3. Seçtiğin içerikleri birbiriyle KARŞILAŞTIR — hangisi neden diğerinden öne çıkıyor, hangi durumda hangisi tercih edilmeli.
4. Türkçe, sıcak ve anlaşılır bir dille yaz, teknik terim kullanma.
5. Sana verilen JSON verisindeki puanlar (imdb_puani) dışında puan uydurma.
6. Seçim yaparken güvenilirlik skoru (wr_skoru) ve güncel popülerliğe bak.
7. Kullanıcının zevkine uyum skorunu da yorumunda samimi bir dille belirt.
8. Kullanıcıya final_skor, wr_skoru, jaccard gibi teknik isimleri telaffuz etme; "güvenilir puan", "zevkine uyum", "ilgi odağı" gibi sade ifadeler kullan.`;

/**
 * Generate AI recommendation for the candidate films
 */
export const generateAiRecommendation = async (candidateFilms, userPreferences = {}) => {
  if (!candidateFilms || candidateFilms.length === 0) {
    return 'Filtrelerinize uyan film bulunamadığı için öneri üretilemedi. Lütfen filtrelerinizi biraz gevşetmeyi deneyin.';
  }

  const settings = getSettings();
  const apiKey = settings.geminiApiKey?.trim();

  // If live Gemini key is present, call Google Gemini REST API
  if (apiKey) {
    try {
      return await callGeminiApi(candidateFilms, userPreferences, apiKey);
    } catch (err) {
      console.warn('Gemini API call failed, using intelligent local engine:', err);
    }
  }

  // Intelligent fallback engine (instant zero-cost, no API key required!)
  return generateLocalSmartRecommendation(candidateFilms, userPreferences);
};

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

/**
 * Calls Google Gemini API trying active models in order
 */
async function postToGemini(requestBody, apiKey) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        return await response.json();
      }

      const errorData = await response.json().catch(() => ({}));
      lastError = new Error(errorData.error?.message || `Gemini HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Gemini API Error');
}

/**
 * Extracts only the final user-facing text from Gemini response,
 * skipping any internal reasoning/thought parts (part.thought === true).
 */
function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const answerParts = parts.filter((p) => !p.thought && typeof p.text === 'string');
  if (answerParts.length > 0) {
    return answerParts.map((p) => p.text).join('\n').trim();
  }
  const fallbackPart = parts.find((p) => typeof p.text === 'string');
  return fallbackPart ? fallbackPart.text.trim() : '';
}

/**
 * Direct call to Google Gemini Flash API (v1beta)
 */
async function callGeminiApi(films, prefs, apiKey) {
  // Prepare top 6 candidates payload
  const candidatesPayload = films.slice(0, 6).map(f => ({
    title: f.title_tr || f.title,
    imdb_puani: f.imdb_puani,
    imdbVotes: f.imdbVotes,
    genre: f.genre,
    yas_uygunlugu: getAgeRatingInfo(f.rated).longLabel,
    platformlar: f.platformlar || f.providers?.join(', '),
    guvenilir_puan: f.wr_skoru,
    popularity: f.popularity,
    zevk_uyumu_yuzde: f.matchPercentage || 70,
    yil: f.year,
    gosterim_tarihi: f.releaseDate || f.year,
    ozet: f.overview
  }));

  const prompt = `Kullanıcı Filtre Tercihleri: ${JSON.stringify(prefs)}
Aday Film/Dizi Listesi:
${JSON.stringify(candidatesPayload, null, 2)}

Lütfen en iyi 2-3 içeriği seçip sistem talimatlarına uygun olarak karşılaştırmalı, samimi bir tavsiye raporu yaz.`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  const data = await postToGemini(requestBody, apiKey);
  const text = extractGeminiText(data);
  return text || 'Tavsiye metni oluşturulamadı.';
}

/**
 * Smart local recommendation engine matching the prompt rules
 */
function generateLocalSmartRecommendation(films, prefs) {
  const topFilms = films.slice(0, 3);
  if (topFilms.length === 0) return '';

  const film1 = topFilms[0];
  const film2 = topFilms[1] || topFilms[0];
  const film3 = topFilms[2] || null;

  let report = `### 🎬 Yapay Zeka Film & Dizi Tavsiye Raporu\n\n`;
  report += `Arama kriterlerinizi ve zevk geçmişinizi inceledim. Bu akşam için öne çıkan en güçlü adayları belirledim:\n\n`;

  // First pick
  report += `#### 1. 🌟 **${film1.title_tr || film1.title}** (${film1.year})\n`;
  report += `* **İzlenebilecek Platform:** 📺 ${film1.platformlar || 'Türkiye dijital platformlarında'}\n`;
  report += `* **Puan Değerlendirmesi:** ⭐ **${film1.imdb_puani} / 10** (${film1.imdbVotes} oy ile son derece güvenilir bir seyirci onayına sahip).\n`;
  report += `* **Neden Seçildi?:** ${film1.overview ? film1.overview.slice(0, 160) + '...' : 'Harika temposu ve akıcı hikayesiyle listenin başında yer alıyor.'} `;
  report += `Kişisel zevkinizle **%${film1.matchPercentage || 85}** oranında örtüşüyor; özellikle türü sevenler için kaçırılmaması gereken bir yapım.\n\n`;

  // Second pick
  if (film2 && film2.id !== film1.id) {
    report += `#### 2. 🍿 **${film2.title_tr || film2.title}** (${film2.year})\n`;
    report += `* **İzlenebilecek Platform:** 📺 ${film2.platformlar || 'Streaming servislerinde'}\n`;
    report += `* **Puan Değerlendirmesi:** ⭐ **${film2.imdb_puani} / 10** (${film2.imdbVotes} oy).\n`;
    report += `* **Neden Seçildi?:** Alternatif olarak daha farklı bir atmosfer arıyorsanız, ${film2.genre || 'bu türdeki'} dengeli kurgusu ve güçlü karakter gelişimiyle keyifli bir seyir vadediyor.\n\n`;
  }

  // Third pick
  if (film3 && film3.id !== film2.id && film3.id !== film1.id) {
    report += `#### 3. 🎯 **${film3.title_tr || film3.title}** (${film3.year})\n`;
    report += `* **İzlenebilecek Platform:** 📺 ${film3.platformlar || 'Dijital servislerde'}\n`;
    report += `* **Puan Değerlendirmesi:** ⭐ **${film3.imdb_puani} / 10** (${film3.imdbVotes} oy).\n`;
    report += `* **Neden Seçildi?:** Zamanı daha hafif veya sürükleyici bir tempoda geçirmek isterseniz harika bir üçüncü seçenek.\n\n`;
  }

  // Comparison section
  report += `---\n\n### ⚖️ Hangisini Seçmelisiniz? (Hızlı Karşılaştırma)\n`;
  report += `* Eğer **derin bir atmosfer, yüksek heyecan ve garantili bir kalite** istiyorsanız doğrudan **${film1.title_tr || film1.title}** ile başlayın.\n`;
  if (film2 && film2.id !== film1.id) {
    report += `* Eğer daha **rahatlatıcı, aileyle veya arkadaşlarla keyifle izlenecek** bir akış arıyorsanız **${film2.title_tr || film2.title}** bu akşam için daha sıcak bir tercih olacaktır.\n`;
  }
  report += `\n*İyi seyirler dilerim! 🍿*`;

  return report;
}

/**
 * Interactive Chatbot with Gemini AI (free-form natural conversation + optional movie context)
 */
export const chatWithCineBot = async (chatHistory = [], contextFilms = [], wizardPrefs = {}) => {
  const settings = getSettings();
  const apiKey = settings.geminiApiKey?.trim();

  if (!apiKey) {
    return 'Gemini API anahtarı bulunamadı. Sağ üstteki **Ayarlar** simgesinden Gemini API anahtarınızı eklediğinizde her konuda sınırsız sohbet edebiliriz.';
  }

  try {
    return await callGeminiChatApi(chatHistory, contextFilms, wizardPrefs, apiKey);
  } catch (err) {
    console.error('Gemini Chat API error:', err);
    return `Gemini AI bağlantısında bir sorun oluştu: ${err.message}. Lütfen Ayarlar'daki Gemini API anahtarınızı ve internet bağlantınızı kontrol edin.`;
  }
};

async function callGeminiChatApi(chatHistory, contextFilms, wizardPrefs, apiKey) {
  const topContext = (contextFilms || []).slice(0, 8).map((f) => ({
    baslik: f.title_tr || f.title,
    tur: f.genre,
    yil: f.year,
    imdb: f.imdb_puani,
    yas_uygunlugu: getAgeRatingInfo(f.rated).shortLabel,
    platformlar: f.platformlar || 'Belirtilmemiş'
  }));

  const systemText = `Sen CineAI'ın zeki, samimi ve çok yönlü yapay zeka sohbet asistanısın.
Kullanıcıyla doğal bir muhabbet mantığıyla konuşursun. Kullanıcı sana ne sorarsa (film/dizi önerisi, bir filmin konusu/oyuncuları/analizi, günlük sohbet, genel bilgi, farklı tarzda öneriler, herhangi bir soru) doğrudan onun istediği konuya odaklanarak yanıt ver.

Kurallar:
- Sadece eldeki listeye bağlı kalma! Kullanıcı başka filmler, farklı konular veya genel sorular sorarsa kendi bilginle özgürce cevapla.
- Eğer kullanıcı "şu an ekranda ne var / listeden öner" derse, arka plandaki güncel liste bilgisinden yararlanabilirsin:
  Güncel ekran listesi: ${JSON.stringify(topContext)}
- Teknik kodları (PG-13, wr_skoru, Bayes, Jaccard vb.) kullanma; anlaşılır ve samimi Türkçe ile konuş.
- Sadece doğrudan kullanıcıya verilecek nihai Türkçe yanıtı yaz; İngilizce taslak, planlama notu veya sahne yönlendirmesi (*Intro:*, persona notu vb.) kesinlikle yazma.`;

  // Gemini API requires contents to start with 'user' and alternate 'user' / 'model'
  const rawMsgs = chatHistory
    .filter((m) => m.text && m.text.trim())
    .slice(-12)
    .map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text.trim()
    }));

  const contents = [];
  for (const msg of rawMsgs) {
    if (contents.length === 0 && msg.role !== 'user') {
      continue;
    }
    const prev = contents[contents.length - 1];
    if (prev && prev.role === msg.role) {
      prev.parts[0].text += `\n\n${msg.text}`;
    } else {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }]
      });
    }
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Merhaba, film önerir misin?' }] });
  }

  const data = await postToGemini(
    {
      system_instruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048
      }
    },
    apiKey
  );

  const reply = extractGeminiText(data);
  return reply || generateLocalChatFallback(chatHistory, contextFilms, wizardPrefs);
}

function generateLocalChatFallback(chatHistory, contextFilms, wizardPrefs) {
  const lastUserMsg = [...chatHistory].reverse().find((m) => m.sender === 'user')?.text?.toLowerCase() || '';
  const films = contextFilms || [];

  // Count how many bot responses have already been sent to rotate recommendations
  const botTurns = chatHistory.filter((m) => m.sender === 'bot').length;

  if (lastUserMsg.match(/^(selam|merhaba|hey|slm|naber|nasılsın)/)) {
    return 'Merhaba! 🎬 Ben CineAI asistanınım. İstersen sağ üstteki **Yenile** ikonuyla adım adım sihirbazı çalıştırabilir, istersen de bana nasıl bir film/dizi aradığını doğrudan yazabilirsin!';
  }

  if (films.length === 0) {
    return 'Şu an elimde filtrelenmiş içerik görünmüyor. İsterseniz sağ üstteki yenile ikonuyla sihirbazı başlatabilir veya sol paneldeki filtreleri biraz esnetebilirsiniz.';
  }

  if (lastUserMsg.includes('aile') || lastUserMsg.includes('çocuk')) {
    const familyPicks = films.filter((f) => {
      const age = getAgeRatingInfo(f.rated).ageGroup;
      return age.includes('0-4') || age.includes('5-9') || (f.genre || '').toLowerCase().includes('family') || (f.genre || '').toLowerCase().includes('aile');
    });
    const pick = familyPicks[botTurns % Math.max(familyPicks.length, 1)] || films[botTurns % films.length];
    return `Ailece keyifle izleyebileceğiniz güzel bir seçenek: **${pick.title_tr || pick.title}** (${pick.year}). ⭐ **${pick.imdb_puani}** IMDb puanına sahip ve **${getAgeRatingInfo(pick.rated).shortLabel}** seviyesinde. ${pick.platformlar ? `Şu an **${pick.platformlar}** üzerinden izleyebilirsiniz.` : ''}`;
  }

  if (lastUserMsg.includes('yenile') || lastUserMsg.includes('farklı') || lastUserMsg.includes('başka') || lastUserMsg.includes('yeni')) {
    const startIdx = (botTurns * 3) % films.length;
    const rotated = [];
    for (let i = 0; i < Math.min(3, films.length); i++) {
      rotated.push(films[(startIdx + i) % films.length]);
    }
    const listText = rotated
      .map((f) => `• **${f.title_tr || f.title}** (${f.year}) — ⭐ ${f.imdb_puani}${f.platformlar ? ` (${f.platformlar})` : ''}`)
      .join('\n');
    return `Elbette, listeden farklı seçenekler derledim:\n${listText}\n\nBunlardan birini seçebilir ya da Gemini AI ile sınırsız sohbet için Ayarlar'dan API anahtarınızı kontrol edebilirsiniz.`;
  }

  // Pick a varied movie based on turn index instead of always films[0]
  const pick = films[botTurns % films.length];
  return `Öne çıkan bir başka önerim: **${pick.title_tr || pick.title}** (${pick.year}) — ⭐ **${pick.imdb_puani}** IMDb puanı. ${(pick.overview || '').slice(0, 160)}... ${pick.platformlar ? `\n\n📺 Platform: **${pick.platformlar}**` : ''}`;
}

