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

function safeText(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.description) return safeText(val.description);
    if (val.suggestion) return safeText(val.suggestion);
    if (val.title) return safeText(val.title);
    if (val.text) return safeText(val.text);
    return JSON.stringify(val);
  }
  return String(val);
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
              {/* 1. Edebi Skorlar */}
              {analysis.overallScores && typeof analysis.overallScores === 'object' && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)]">
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-surface)]">
                    <span className="text-[10px] text-[var(--text-dim)] block mb-0.5">Edebi Kalite</span>
                    <span className="text-base font-bold text-[var(--primary-gold)] font-mono">
                      {safeText(analysis.overallScores.literaryQuality || 8)} / 10
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-surface)]">
                    <span className="text-[10px] text-[var(--text-dim)] block mb-0.5">Dramatik Derinlik</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {safeText(analysis.overallScores.dramaticDepth || 7)} / 10
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-surface)]">
                    <span className="text-[10px] text-[var(--text-dim)] block mb-0.5">Akış & Ritim</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {safeText(analysis.overallScores.flowAndRhythm || 8)} / 10
                    </span>
                  </div>
                </div>
              )}

              {/* Baş Dramaturg Değerlendirmesi */}
              {analysis.executiveSummary && (
                <div className="p-3.5 bg-[var(--bg-card)] rounded-xl border border-[var(--primary-gold-border)] space-y-1.5">
                  <span className="font-bold text-[var(--primary-gold)] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <span>👑</span> Baş Dramaturg Görüşü:
                  </span>
                  <p className="text-[var(--text-main)] leading-relaxed italic m-0">
                    "{safeText(analysis.executiveSummary)}"
                  </p>
                  {analysis.structureAndPacing && (
                    <p className="text-[var(--text-muted)] text-[11px] leading-relaxed pt-2 border-t border-[var(--border-subtle)] m-0">
                      <strong className="text-[var(--text-main)]">Tempo & Ritim:</strong> {safeText(analysis.structureAndPacing)}
                    </p>
                  )}
                </div>
              )}

              {/* 2. Dramaturji & Sahneleme Vizyonu */}
              {Array.isArray(analysis.dramaturgicalInsights) && analysis.dramaturgicalInsights.length > 0 && (
                <div className="p-3.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] space-y-3">
                  <span className="font-bold text-[var(--primary-gold)] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <span>🎭</span> Dramaturji & Sahneleme Vizyonu:
                  </span>
                  <div className="space-y-2.5">
                    {analysis.dramaturgicalInsights.map((insight: any, idx: number) => {
                      const isObj = typeof insight === 'object' && insight !== null;
                      const title = isObj && insight.title ? safeText(insight.title) : `Dramaturgi Notu #${idx + 1}`;
                      const desc = isObj && insight.description ? safeText(insight.description) : safeText(insight);
                      const tip = isObj && insight.actionableTip ? safeText(insight.actionableTip) : null;

                      return (
                        <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                          <span className="font-bold text-[var(--text-main)] block">{title}</span>
                          <p className="text-[var(--text-muted)] leading-relaxed m-0">{desc}</p>
                          {tip && (
                            <div className="pt-1 text-[11px] text-[var(--primary-gold)] font-medium">
                              💡 <strong>Uygulama:</strong> {tip}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Metin İyileştirmeleri & Nokta Atışı Düzeltmeler */}
              {Array.isArray(analysis.textCorrections) && analysis.textCorrections.length > 0 && (
                <div className="p-3.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] space-y-2.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <span>✍️</span> Nokta Atışı Metin İyileştirmeleri:
                  </span>
                  <div className="space-y-2">
                    {analysis.textCorrections.map((corr: any, idx: number) => {
                      const isObj = typeof corr === 'object' && corr !== null;
                      const snippet = isObj && corr.originalSnippet ? safeText(corr.originalSnippet) : '';
                      const suggestion = isObj && corr.suggestion ? safeText(corr.suggestion) : safeText(corr);
                      const reason = isObj && corr.reason ? safeText(corr.reason) : '';

                      return (
                        <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                          {snippet && (
                            <div className="text-[11px] text-red-300/80 line-through">
                              ❌ {snippet}
                            </div>
                          )}
                          <div className="text-[11px] text-emerald-300 font-medium">
                            ✓ {suggestion}
                          </div>
                          {reason && (
                            <div className="text-[10px] text-[var(--text-dim)]">
                              ℹ️ {reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Giriş Kancası & Vurucu Kapanış */}
              {analysis.hookAndClosingEnhancement && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)]">
                  {analysis.hookAndClosingEnhancement.openingHookSuggestion && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-gold)] block">
                        🎣 Çarpıcı Giriş Kancası:
                      </span>
                      <p className="text-[var(--text-main)] italic leading-relaxed m-0">
                        "{safeText(analysis.hookAndClosingEnhancement.openingHookSuggestion)}"
                      </p>
                    </div>
                  )}
                  {analysis.hookAndClosingEnhancement.closingPunchlineSuggestion && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-gold)] block">
                        🎯 Vurucu Kapanış Cümlesi:
                      </span>
                      <p className="text-[var(--text-main)] italic leading-relaxed m-0">
                        "{safeText(analysis.hookAndClosingEnhancement.closingPunchlineSuggestion)}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Alternatif Başlıklar */}
              {Array.isArray(analysis.titleSuggestions) && analysis.titleSuggestions.length > 0 && (
                <div className="p-3.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                  <span className="font-bold text-[var(--text-main)] flex items-center justify-between text-[11px] uppercase tracking-wider">
                    <span>💡 Alternatif Başlık Önerileri (Tıkla ve Başlığa Uygula):</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysis.titleSuggestions.map((item: any, idx: number) => {
                      const isObj = typeof item === 'object' && item !== null;
                      const titleStr = isObj && item.title ? safeText(item.title) : safeText(item);
                      const styleStr = isObj && item.style ? safeText(item.style) : 'Alternatif';

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onApplyTitle?.(titleStr)}
                          className="p-2 text-left rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--primary-gold-dim)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-all group cursor-pointer"
                        >
                          <span className="text-[9px] font-mono text-[var(--primary-gold)] block mb-0.5 uppercase tracking-wider">
                            {styleStr}
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-main)] group-hover:text-[var(--primary-gold)] block">
                            {titleStr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. Anahtar Kelimeler */}
              {Array.isArray(analysis.keywords) && analysis.keywords.length > 0 && (
                <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-dim)] uppercase tracking-wider text-[10px]">
                      🏷️ Önerilen Anahtar Kelimeler:
                    </span>
                    {onApplyKeywords && (
                      <button
                        type="button"
                        onClick={() => onApplyKeywords(analysis.keywords.map(k => safeText(k)).join(', '))}
                        className="text-[10px] text-[var(--primary-gold)] hover:underline font-bold"
                      >
                        Hepsini Ekle +
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keywords.map((kw: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-[11px]"
                      >
                        #{safeText(kw)}
                      </span>
                    ))}
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
