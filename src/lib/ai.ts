export interface DramaturgicalInsight {
  title: string;
  description: string;
  actionableTip: string;
}

export interface TextCorrection {
  originalSnippet: string;
  suggestion: string;
  reason: string;
}

export interface TitleSuggestion {
  title: string;
  style: string;
}

export interface AIAnalysisResult {
  overallScores?: {
    literaryQuality: number; // 1-10
    dramaticDepth: number;   // 1-10
    flowAndRhythm: number;   // 1-10
  };
  executiveSummary: string;
  structureAndPacing: string;
  dramaturgicalInsights: DramaturgicalInsight[];
  textCorrections: TextCorrection[];
  hookAndClosingEnhancement?: {
    openingHookSuggestion: string;
    closingPunchlineSuggestion: string;
  };
  titleSuggestions: TitleSuggestion[];
  keywords: string[];
}

import { adminDb } from './firebase-admin';

export async function analyzeArticleWithAI(
  title: string,
  content: string,
  category: string
): Promise<{ success?: boolean; data?: AIAnalysisResult; error?: string }> {
  let apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    try {
      const snap = await adminDb.collection('settings').doc('integrations').get();
      if (snap.exists && snap.data()?.openrouterApiKey) {
        apiKey = snap.data()!.openrouterApiKey;
      }
    } catch (e) {
      console.warn("[AI] Firestore settings/integrations okuma hatası:", e);
    }
  }

  if (!apiKey) {
    return {
      error: "Yapay zeka analiz servisi için API anahtarı (OPENROUTER_API_KEY) tanımlanmamış."
    };
  }

  if (!content || content.trim().length < 30) {
    return {
      error: "Analiz yapabilmek için lütfen en az birkaç cümlelik bir metin girin."
    };
  }

  // Kategoriye özel uzmanlık ve değerlendirme profili oluşturma
  const cat = (category || 'Kulis').toLowerCase();
  
  let categoryRolePrompt = "";
  if (cat.includes('makale') || cat.includes('akademik')) {
    categoryRolePrompt = `Uzmanlık Alanın: Akademik Tiyatro Kuramcısı, Hakem ve Tiyatro Tarihçisi.
Değerlendirme Odağın:
- Metnin tezi ve sav tutarlılığı.
- Tiyatro kuramı (Stanislavski, Brecht, Artaud, Grotowski, Absürd tiyatro, Epik tiyatro vb.) terminolojisinin doğru kullanımı.
- Akademik ciddiyet, nesnel üslup ve kavramsal derinlik.
- Savların temellendirilmesi ve literatürle bağ kurma potansiyeli.`;
  } else if (cat.includes('blog')) {
    categoryRolePrompt = `Uzmanlık Alanın: Usta Edebi Eleştirmen, Sanat Yazarı ve Kültür-Sanat Editörü.
Değerlendirme Odağın:
- Edebi dil zenginliği, akıcılık ve özgün metaforlar.
- Tiyatro izleyicisinde merak, estetik zevk ve düşünce uyandırma gücü.
- Sahne atmosferinin, ışığın, oyunculuğun ve duygunun kelimelere dökülüşü.
- Okuru içine çeken sanatsal ve samimi bir deneme üslubu.`;
  } else if (cat.includes('haber') || cat.includes('duyuru')) {
    categoryRolePrompt = `Uzmanlık Alanın: Tiyatro Basın Sözcüsü, İletişim ve Medya Koordinatörü.
Değerlendirme Odağın:
- Gazetecilik 5N1K ilkeleri (Ne, Nerede, Ne Zaman, Nasıl, Neden, Kim).
- Kısa, net, dolambaçsız ve vurucu bilgilendirme.
- Seyirciyi oyuna / etkinliğe çağıran güçlü 'Harekete Geçirici Mesaj' (Call to Action).
- Manşet niteliğinde haber başlığı önerileri.`;
  } else {
    // Kulis (Kulüp İçi & Prova Günlüğü)
    categoryRolePrompt = `Uzmanlık Alanın: Üniversite Tiyatro Kulübü Başrejisörü, Sahne Amiri ve Kulis Danışmanı.
Değerlendirme Odağın:
- Prova sürecinin canlılığı, ekip dinamikleri ve oyuncu motivasyonu.
- Sahne arkası aksiliklerinin çözümü ve teknik koordinasyon (ışık, dekor, ses).
- Aşırı resmiyetten uzak, sıcak, yapıcı, kolektif tiyatro ruhunu besleyen bir kulis dili.`;
  }

  const systemPrompt = `Sen Türkiye'nin en köklü üniversite tiyatro kulübünün kıdemli baş dramaturgu, edebiyat danışmanı ve usta Türkçe editörüsün.
Kullanıcının seçtiği yazı kategorisi: "${category || 'Kulis'}".

${categoryRolePrompt}

DİL VE ÜSLUP KURALLARI (ÇOK ÖNEMLİ):
1. YANITIN %100 AKICI VE KUSURSUZ TÜRKÇE OLMALIDIR. Asla ve kesinlikle İngilizce kelime, terim veya cümle kullanma.
2. Yüzeysel veya genel geçer beylik laflar etme; doğrudan yazarın metnindeki cümlelere, karakterlere ve ifadelere atıf yap.
3. Düzeltmelerde ("textCorrections") metinden birebir alıntı ("originalSnippet") göster ve daha güçlü Türkçe alternatifini ("suggestion") gerekçesiyle açıkla.
4. Çıktı formatı haricinde hiçbir ek metin yazma, sadece saf JSON döndür.

Aşağıdaki JSON şemasına BİREBİR uyan geçerli bir JSON çıktısı üret:
{
  "overallScores": {
    "literaryQuality": 8,
    "dramaticDepth": 7,
    "flowAndRhythm": 8
  },
  "executiveSummary": "Yazının seçilen '${category || 'Kulis'}' kategorisindeki başarısını ve etkisini özetleyen 2 cümlelik vurucu baş dramaturg değerlendirmesi.",
  "structureAndPacing": "Metnin anlatım akışı, tempo, paragraf geçişleri ve kategoriye uygunluk analizi.",
  "dramaturgicalInsights": [
    {
      "title": "Kategoriye Uygun Özel İnceleme Başlığı",
      "description": "Metindeki düşüncenin alt metnini ve sanatsal boyutunu güçlendirecek detaylı Türkçe analiz.",
      "actionableTip": "Yazarın bu yazıyı mükemmelleştirmek için uygulayabileceği somut adım."
    },
    {
      "title": "Sahne / Anlatım Gücü İncelemesi",
      "description": "Okuyucuda veya ekipte güçlü rezonans uyandıracak detaylı sanatsal analiz.",
      "actionableTip": "Somut revizyon veya ilave önerisi."
    }
  ],
  "textCorrections": [
    {
      "originalSnippet": "Metinden aynen alınan geliştirilebilir bir cümle",
      "suggestion": "Daha akıcı, edebi ve pürüzsüz Türkçe revizyonu",
      "reason": "Gerekçesi (anlatım bozukluğu, kelime tekrarı, imla veya ton kayması)"
    }
  ],
  "hookAndClosingEnhancement": {
    "openingHookSuggestion": "Okuyucuyu ilk satırdan yakalayacak çarpıcı bir alternatif giriş cümlesi.",
    "closingPunchlineSuggestion": "Yazıyı akıllarda iz bırakarak noktalayacak unutulmaz bir son cümle."
  },
  "titleSuggestions": [
    { "title": "Başlık 1", "style": "Şiirsel / Metaforik" },
    { "title": "Başlık 2", "style": "Çarpıcı & Merak Uyandırıcı" },
    { "title": "Başlık 3", "style": "Akademik / Kuramsal" },
    { "title": "Başlık 4", "style": "Kısa & Vurucu" }
  ],
  "keywords": ["anahtar1", "anahtar2", "anahtar3", "anahtar4", "anahtar5"]
}`;

  const userPrompt = `İNCELENECEK YAZI BİLGİLERİ:
Kategori: ${category || 'Kulis'}
Başlık: ${title || 'Başlıksız'}
Metin:
${content.slice(0, 4500)}`;

  // En yüksek Türkçe anlama ve üretim kabiliyetine sahip modeller sıralaması
  const models = [
    'minimax/minimax-m3:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    'inclusionai/ling-3.0-flash-fin:free',
    'openrouter/free'
  ];

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://fsmtiyatro.com",
          "X-Title": "FSM Tiyatro Kulübü",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 2200
        })
      });

      if (!response.ok) {
        console.warn(`[AI_ANALYZE] Model ${model} yanıt veremedi (${response.status}), diğer modele geçiliyor...`);
        continue;
      }

      const resData = await response.json();
      const rawText = resData.choices?.[0]?.message?.content;
      if (!rawText) continue;

      let cleaned = rawText.trim();
      if (cleaned.includes('</think>')) {
        cleaned = cleaned.split('</think>')[1].trim();
      }
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
      if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
      cleaned = cleaned.trim();

      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed: AIAnalysisResult = JSON.parse(cleaned);
      return { success: true, data: parsed };
    } catch (e: any) {
      console.warn(`[AI_ANALYZE] Model ${model} hata verdi:`, e.message);
    }
  }

  return {
    error: "Yapay zeka analiz servisine şu anda ulaşılamadı. Lütfen kısa süre sonra tekrar deneyin."
  };
}
