'use client';

import { useState, useTransition } from 'react';
import { getAIAnalysis } from '@/lib/actions/content.actions';
import { AIAnalysisResult } from '@/lib/ai';

interface AIReviewHelperProps {
  getTitle: () => string;
  getContent: () => string;
  getCategory: () => string;
  onApplyTitle?: (title: string) => void;
  onApplyKeywords?: (keywords: string) => void;
}

export default function AIReviewHelper({
  getTitle,
  getContent,
  getCategory,
  onApplyTitle,
  onApplyKeywords
}: AIReviewHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAnalyze = () => {
    const title = getTitle();
    const content = getContent();
    const category = getCategory();

    if (!content || content.trim().length < 30) {
      setErrorMessage("İnceleme yapabilmek için lütfen önce içerik alanına en az birkaç cümle yazın.");
      setIsOpen(true);
      return;
    }

    setErrorMessage(null);
    setIsOpen(true);

    startTransition(async () => {
      const res = await getAIAnalysis(title, content, category);
      if (res.error) {
        setErrorMessage(res.error);
        setAnalysis(null);
      } else if (res.data) {
        setAnalysis(res.data);
        setErrorMessage(null);
      }
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 p-3.5 bg-[var(--bg-card)] border border-[var(--primary-gold-border)] rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-gold-muted)] flex items-center justify-center text-[var(--primary-gold)]">
            <ion-icon name="sparkles" style={{ fontSize: '1.1rem' }}></ion-icon>
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-main)]">Yapay Zeka Metin Danışmanı</div>
            <div className="text-[11px] text-[var(--text-dim)]">İmla kontrolü, dramaturgi ve başlık tavsiyeleri</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isPending}
          className="px-4 py-2 bg-[var(--primary-gold)] text-black font-bold text-xs rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
        >
          {isPending ? (
            <>
              <ion-icon name="sync-outline" className="animate-spin"></ion-icon>
              <span>İnceleniyor...</span>
            </>
          ) : (
            <>
              <ion-icon name="sparkles-outline"></ion-icon>
              <span>✨ Metni İncelet & Öneri Al</span>
            </>
          )}
        </button>
      </div>

      {/* Sonuç Paneli */}
      {isOpen && (
        <div className="mt-4 p-5 bg-[var(--bg-surface)] border border-[var(--primary-gold-border)] rounded-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h4 className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider flex items-center gap-1.5">
              <ion-icon name="bulb-outline"></ion-icon>
              Dramaturgi & Editör İnceleme Raporu
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[var(--text-dim)] hover:text-[var(--text-main)] text-sm"
            >
              ✕
            </button>
          </div>

          {isPending && (
            <div className="py-8 text-center space-y-2">
              <div className="inline-block animate-spin text-[var(--primary-gold)] text-2xl">
                <ion-icon name="sync-outline"></ion-icon>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Metin analiz ediliyor, dramatik yapı ve imla tahlil ediliyor...
              </p>
            </div>
          )}

          {errorMessage && !isPending && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          {analysis && !isPending && (
            <div className="space-y-4 text-xs">
              {/* İmla ve Anlatım */}
              {analysis.grammarTips && analysis.grammarTips.length > 0 && (
                <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
                  <span className="font-bold text-[var(--text-main)] block flex items-center gap-1.5">
                    <span className="text-emerald-400">✍️</span> İmla & Anlatım İpuçları:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] leading-relaxed">
                    {analysis.grammarTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dramaturgi & Sanatsal Derinlik */}
              {analysis.dramaturgicalInsights && analysis.dramaturgicalInsights.length > 0 && (
                <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
                  <span className="font-bold text-[var(--primary-gold)] block flex items-center gap-1.5">
                    <span>🎭</span> Tiyatro & Sanatsal Derinleştirme:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-muted)] leading-relaxed">
                    {analysis.dramaturgicalInsights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Alternatif Başlıklar */}
              {analysis.titleSuggestions && analysis.titleSuggestions.length > 0 && (
                <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] space-y-2">
                  <span className="font-bold text-[var(--text-main)] block flex items-center gap-1.5">
                    <span>💡</span> Alternatif Başlık Fikirleri:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {analysis.titleSuggestions.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onApplyTitle && onApplyTitle(t)}
                        className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--primary-gold-muted)] border border-[var(--border-medium)] hover:border-[var(--primary-gold)] rounded-md text-[11px] text-[var(--text-main)] text-left transition-colors flex items-center gap-1"
                        title="Bu başlığı kullan"
                      >
                        <span>{t}</span>
                        <span className="text-[10px] text-[var(--primary-gold)] font-bold">↵ Seç</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Anahtar Kelimeler */}
              {analysis.keywords && analysis.keywords.length > 0 && (
                <div className="p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] space-y-2">
                  <span className="font-bold text-[var(--text-main)] block flex items-center gap-1.5">
                    <span>🏷️</span> Önerilen Anahtar Kelimeler:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[var(--primary-gold-muted)] text-[var(--primary-gold)] border border-[var(--primary-gold-border)] rounded-full text-[10px] font-semibold"
                      >
                        #{kw}
                      </span>
                    ))}
                    {onApplyKeywords && (
                      <button
                        type="button"
                        onClick={() => onApplyKeywords(analysis.keywords.join(', '))}
                        className="px-2.5 py-0.5 bg-[var(--primary-gold)] text-black rounded-full text-[10px] font-bold hover:brightness-110 ml-2"
                      >
                        Hepsini Ekle
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
