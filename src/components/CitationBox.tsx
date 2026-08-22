'use client';

import { useState } from 'react';

interface CitationProps {
  title: string;
  author: string;
  date: string;
  url: string;
  journal?: string;
  publisher?: string;
}

export default function CitationBox({
  title,
  author,
  date,
  url,
  journal = 'FSM Tiyatro ve Sahne Sanatları Güncesi',
  publisher = 'Fatih Sultan Mehmet Vakıf Üniversitesi'
}: CitationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'APA' | 'MLA' | 'Chicago' | 'BibTeX' | 'RIS'>('APA');
  const [copied, setCopied] = useState(false);

  const year = date ? new Date(date).getFullYear().toString() : new Date().getFullYear().toString();
  const fullDate = date ? new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  // İsim formatlama (Örn: "Furkan Kemal Teker" -> "Teker, F. K.")
  const authorParts = author.trim().split(' ');
  const lastName = authorParts.length > 1 ? authorParts[authorParts.length - 1] : author;
  const firstNames = authorParts.length > 1 ? authorParts.slice(0, -1).join(' ') : '';
  const initials = authorParts.length > 1 ? authorParts.slice(0, -1).map(n => `${n[0]}.`).join(' ') : '';

  // Formatlar
  const citations: Record<string, string> = {
    APA: `${lastName}, ${initials || firstNames} (${year}). ${title}. ${journal}. ${url}`,
    MLA: `${lastName}, ${firstNames || lastName}. "${title}." ${journal}, ${fullDate || year}, ${url}.`,
    Chicago: `${lastName}, ${firstNames || lastName}. "${title}." ${journal} (${year}). ${url}.`,
    BibTeX: `@article{fsmtiyatro_${year}_${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')},
  title = {${title}},
  author = {${lastName}, ${firstNames || lastName}},
  journal = {${journal}},
  publisher = {${publisher}},
  year = {${year}},
  url = {${url}}
}`,
    RIS: `TY  - JOUR
TI  - ${title}
AU  - ${lastName}, ${firstNames || lastName}
T2  - ${journal}
PB  - ${publisher}
PY  - ${year}
UR  - ${url}
ER  - `
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(citations[activeFormat]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeFormat === 'BibTeX' ? 'bib' : activeFormat === 'RIS' ? 'ris' : 'txt';
    const blob = new Blob([citations[activeFormat]], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `citation-${activeFormat.toLowerCase()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="my-8 p-5 bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] border border-[var(--primary-gold-border)] flex items-center justify-center text-xl">
            <ion-icon name="school-outline"></ion-icon>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] leading-tight">Akademik & Editoryal Alıntı</h4>
            <p className="text-[11px] text-[var(--text-dim)]">Bu makaleyi tez, araştırma veya bildirilerinizde kaynak gösterin</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-outline py-2 px-4 text-xs font-bold flex items-center gap-1.5"
        >
          <ion-icon name={isOpen ? "chevron-up-outline" : "bookmark-outline"}></ion-icon>
          {isOpen ? "Kapat" : "Alıntı Formatları (APA / BibTeX)"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-[var(--border-subtle)] space-y-4 animate-fadeIn">
          {/* Format Seçici */}
          <div className="flex gap-2 flex-wrap">
            {(['APA', 'MLA', 'Chicago', 'BibTeX', 'RIS'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setActiveFormat(fmt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFormat === fmt
                    ? 'bg-[var(--primary-gold)] text-black shadow-sm'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Alıntı Metni Kutusu */}
          <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-main)] whitespace-pre-wrap leading-relaxed select-all">
            {citations[activeFormat]}
          </div>

          {/* Eylemler */}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            <button
              onClick={handleDownload}
              className="btn btn-outline py-2 px-4 text-xs font-bold flex items-center gap-1.5"
              title="Dosya olarak indir"
            >
              <ion-icon name="download-outline"></ion-icon>
              .{activeFormat === 'BibTeX' ? 'bib' : activeFormat === 'RIS' ? 'ris' : 'txt'} İndir
            </button>

            <button
              onClick={handleCopy}
              className="btn btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
            >
              <ion-icon name={copied ? "checkmark-outline" : "copy-outline"}></ion-icon>
              {copied ? "Kopyalandı ✓" : "Alıntıyı Kopyala"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
