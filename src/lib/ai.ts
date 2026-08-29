/**
 * FSM Tiyatro Yapay Zeka Metin Analiz & Dramaturg Servisi
 * OpenRouter & DeepSeek-R1 Entegrasyonu
 */

export interface AIAnalysisResult {
  grammarTips: string[];
  dramaturgicalInsights: string[];
  titleSuggestions: string[];
  keywords: string[];
  rawSummary?: string;
}

export async function analyzeArticleWithAI(
  title: string,
  content: string,
  category: string
): Promise<{ success?: boolean; data?: AIAnalysisResult; error?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

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

  const systemPrompt = `Sen üniversite tiyatro kulübünün kıdemli baş dramaturgu, edebiyat danışmanı ve usta Türkçe editörüsün.
Görevin, kulis/blog/makale yazısını inceleyip yazara yapıcı, derinlikli ve sanatsal açıdan zenginleştirici geri bildirimler sunmaktır.

Aşağıdaki JSON formatında kesinlikle geçerli bir JSON çıktısı üret:
{
  "grammarTips": [
    "İmla, noktalama veya anlatım bozukluğu tespit edilen yerler ve düzeltme tavsiyeleri (1-3 madde)"
  ],
  "dramaturgicalInsights": [
    "Tiyatro kuramı, alt metin (subtext), sahne atmosferi, dramatik gerilim veya felsefi derinlik katabilecek sanatsal öneriler (2-4 madde)"
  ],
  "titleSuggestions": [
    "Yazının etkisini artırabilecek 2-3 alternatif çarpıcı başlık önerisi"
  ],
  "keywords": [
    "Yazıya uygun 4-6 adet anahtar kelime"
  ]
}

ÖNEMLİ: Sadece ve sadece saf JSON formatında yanıt ver. Markdown kod bloğu (\`\`\`json ...) kullanma veya sadece JSON bloğu döndür.`;

  const userPrompt = `Yazı Başlığı: ${title || 'Başlıksız'}
Kategori: ${category || 'Kulis'}
Metin:
${content.slice(0, 4000)}`;

  const models = [
    'deepseek/deepseek-r1:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'qwen/qwen-2.5-72b-instruct:free'
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
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        console.warn(`[AI_ANALYZE] Model ${model} yanıt veremedi (${response.status}), diğer modele geçiliyor...`);
        continue;
      }

      const resData = await response.json();
      const rawText = resData.choices?.[0]?.message?.content;
      if (!rawText) continue;

      // JSON ayrıştırma (Markdown bloklarını temizle)
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
      if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
      cleaned = cleaned.trim();

      // DeepSeek R1 <think>...</think> etiketlerini temizle
      if (cleaned.includes('</think>')) {
        cleaned = cleaned.split('</think>')[1].trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
        if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
        if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
        cleaned = cleaned.trim();
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
