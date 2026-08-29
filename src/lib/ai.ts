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

  const systemPrompt = `Sen; Stanislavski, Brecht, Artaud ve çağdaş tiyatro kuramlarına hakim, Türk tiyatrosunun ve edebiyatının usta bir baş dramaturgu, üslup ustası ve kıdemli genel yayın yönetmenisin.
Görevin, yazılan kulis/blog/makale metnini derinlemesine inceleyerek yüzeysel olmayan, somut, metne özel ve sanatsal açıdan zenginleştirici bir inceleme raporu hazırlamaktır.

Analizinde mutlaka şu hususlara dikkat et:
1. Genel geçer klişelerden kaçın, doğrudan metnin cümlelerine ve fikirlerine atıf yap.
2. Düzeltmelerde ("textCorrections") metinden birebir alıntı ("originalSnippet") göster ve daha güçlü, pürüzsüz alternatifini ("suggestion") açıkla.
3. Dramaturji önerilerinde ("dramaturgicalInsights") alt metin (subtext), dramatik gerilim, atmosfer, seyirci/okuyucu ile kurulan duygusal rezonans ve tiyatral vizyon katacak somut öneriler sun.
4. Giriş kancası (hook) ve vurucu kapanış (punchline) için ilham verici revizyonlar üret.

Aşağıdaki JSON şemasına BİREBİR uyan geçerli bir JSON çıktısı üret:
{
  "overallScores": {
    "literaryQuality": 8,
    "dramaticDepth": 7,
    "flowAndRhythm": 8
  },
  "executiveSummary": "Metnin ana fikrini, gücünü ve genel etkisini özetleyen 2-3 cümlelik vurucu baş dramaturg değerlendirmesi.",
  "structureAndPacing": "Metnin anlatım akışı, paragraf geçişleri, tempo ve ritim analizi (1-2 paragraf).",
  "dramaturgicalInsights": [
    {
      "title": "Karakter/Olay Örgüsü Derinleştirme",
      "description": "Metindeki düşüncenin alt metnini ve felsefi boyutunu güçlendirecek detaylı analiz.",
      "actionableTip": "Yazarın uygulayabileceği somut adım."
    },
    {
      "title": "Sahne Atmosferi ve Duyusal Dil",
      "description": "Okuyucuda/seyircide 5 duyuya hitap eden sahne hissi uyandırma analizi.",
      "actionableTip": "Örnek duyusal benzetme veya atmosfer önerisi."
    }
  ],
  "textCorrections": [
    {
      "originalSnippet": "Metinden aynen alınan ve iyileştirilebilecek bir cümle",
      "suggestion": "Daha akıcı, edebi ve hatasız revizyonu",
      "reason": "Gerekçesi (imla, anlatım bozukluğu, kelime tekrarı, ton kayması vb.)"
    }
  ],
  "hookAndClosingEnhancement": {
    "openingHookSuggestion": "Okuyucuyu ilk satırdan yakalayacak çarpıcı bir alternatif giriş cümlesi.",
    "closingPunchlineSuggestion": "Yazıyı zihinde yankı uyandırarak noktalayacak unutulmaz bir son cümle."
  },
  "titleSuggestions": [
    { "title": "Başlık 1", "style": "Şiirsel / Metaforik" },
    { "title": "Başlık 2", "style": "Çarpıcı & Merak Uyandırıcı" },
    { "title": "Başlık 3", "style": "Akademik / Kuramsal" },
    { "title": "Başlık 4", "style": "Kısa & Vurucu" }
  ],
  "keywords": ["anahtar1", "anahtar2", "anahtar3", "anahtar4", "anahtar5"]
}

ÖNEMLİ: Sadece ve sadece saf JSON döndür. Kod bloğu işareti (\`\`\`json) veya JSON harici hiçbir metin yazma.`;

  const userPrompt = `İNCELENECEK YAZI BİLGİLERİ:
Başlık: ${title || 'Başlıksız'}
Kategori: ${category || 'Kulis / Blog'}
Metin:
${content.slice(0, 4500)}`;

  const models = [
    'openrouter/free',
    'dots-studio/dots-3-note-preview:free',
    'minimax/minimax-m3:free',
    'z-ai/glm-5.2:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    'inclusionai/ling-3.0-flash-fin:free'
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
          temperature: 0.6,
          max_tokens: 2000
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
