'use client';

import { useState, useTransition } from 'react';
import { applyForTeamNeed } from '@/app/actions';

interface TeamNeedApplyButtonProps {
  needId: string;
  roleName: string;
  hasApplied?: boolean;
}

export default function TeamNeedApplyButton({ needId, roleName, hasApplied = false }: TeamNeedApplyButtonProps) {
  const [applied, setApplied] = useState(hasApplied);
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  if (applied) {
    return (
      <div className="w-full py-2.5 px-4 rounded-lg bg-[var(--primary-gold-dim)] border border-[var(--primary-gold-border)] text-[var(--primary-gold)] text-xs font-bold text-center flex items-center justify-center gap-2">
        <ion-icon name="checkmark-circle-outline" style={{ fontSize: '1rem' }} />
        Başvurunuz Alındı (Değerlendiriliyor)
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('needId', needId);
      formData.append('roleName', roleName);
      formData.append('note', note);

      const res = await applyForTeamNeed(formData);
      if (res && 'error' in res && res.error) {
        setError(res.error);
      } else {
        setApplied(true);
        setIsOpen(false);
      }
    });
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)} 
          className="btn btn-outline w-full text-xs py-2.5 font-bold flex items-center justify-center gap-2 hover:border-[var(--primary-gold)] hover:text-[var(--primary-gold)] transition-all"
        >
          <ion-icon name="hand-right-outline" />
          Ekibe Katılmak İçin Başvur
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-3.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-medium)] flex flex-col gap-2.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-main)]">📝 {roleName} Başvurusu</span>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="text-[var(--text-dim)] hover:text-[var(--text-main)]"
            >
              ✕
            </button>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="İsteğe bağlı: Varsa deneyiminiz veya eklemek istediğiniz kısa bir not..."
            rows={2}
            className="w-full p-2.5 rounded-lg border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] text-xs outline-none focus:border-[var(--primary-gold)]"
          />

          {error && <div className="text-red-400 text-[11px]">{error}</div>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary flex-1 py-2 text-xs font-bold"
            >
              {isPending ? 'İletiliyor...' : 'Başvuruyu Gönder'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-outline py-2 px-3 text-xs"
            >
              İptal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
