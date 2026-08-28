'use client';

import { useState, useTransition } from 'react';
import { updateUserTitles } from '@/app/actions';

interface TitleManagerProps {
  userId: string;
  userTitles: string[];
  availableTitles: string[];
  canEdit: boolean;
}

export default function TitleManager({ userId, userTitles = [], availableTitles = [], canEdit }: TitleManagerProps) {
  const [titles, setTitles] = useState<string[]>(userTitles);
  const [selectedToAdd, setSelectedToAdd] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAddTitle = (titleToAdd: string) => {
    const trimmed = titleToAdd.trim();
    if (!trimmed || titles.includes(trimmed)) return;

    const nextTitles = [...titles, trimmed];
    setTitles(nextTitles);
    setSelectedToAdd('');
    setCustomTitle('');
    setIsAddingCustom(false);

    startTransition(async () => {
      await updateUserTitles(userId, nextTitles);
    });
  };

  const handleRemoveTitle = (titleToRemove: string) => {
    const nextTitles = titles.filter(t => t !== titleToRemove);
    setTitles(nextTitles);

    startTransition(async () => {
      await updateUserTitles(userId, nextTitles);
    });
  };

  if (!canEdit) {
    if (!titles.length) return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {titles.map((t, idx) => (
          <span
            key={idx}
            style={{
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: '600',
              background: 'rgba(212, 175, 55, 0.12)',
              color: 'var(--primary-gold)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            {t}
          </span>
        ))}
      </div>
    );
  }

  // Havuzda olup kullanıcının henüz sahip olmadığı unvanlar
  const unassignedAvailable = availableTitles.filter(t => !titles.includes(t));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px', opacity: isPending ? 0.7 : 1 }}>
      {/* Mevcut Unvanlar / Tagler */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
        {titles.map((t, idx) => (
          <span
            key={idx}
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: '600',
              background: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--primary-gold)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap'
            }}
          >
            {t}
            <button
              type="button"
              onClick={() => handleRemoveTitle(t)}
              title={`${t} unvanını kaldır`}
              disabled={isPending}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-gold)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                lineHeight: 1,
                padding: '0 0.1rem',
                opacity: 0.8
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Unvan Ekleme Kontrolü (Hızlı seçim veya özel yazım) */}
      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {!isAddingCustom ? (
          <>
            <select
              value={selectedToAdd}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  setIsAddingCustom(true);
                  setSelectedToAdd('');
                } else if (val) {
                  handleAddTitle(val);
                }
              }}
              disabled={isPending}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-muted)',
                border: '1px dashed var(--border-medium)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '150px'
              }}
            >
              <option value="">+ Unvan/Görev Ekle</option>
              {unassignedAvailable.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
              <option value="__custom__">✏️ Yeni Özel Unvan Yaz...</option>
            </select>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTitle(customTitle);
                } else if (e.key === 'Escape') {
                  setIsAddingCustom(false);
                }
              }}
              placeholder="Örn: Sayman"
              autoFocus
              style={{
                padding: '0.25rem 0.45rem',
                borderRadius: '4px',
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--primary-gold-border)',
                fontSize: '0.72rem',
                width: '110px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => handleAddTitle(customTitle)}
              disabled={isPending || !customTitle.trim()}
              style={{
                padding: '0.25rem 0.45rem',
                background: 'var(--primary-gold)',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        )}
        {isPending && <span style={{ fontSize: '0.65rem', color: 'var(--primary-gold)' }}>Kaydediliyor...</span>}
      </div>
    </div>
  );
}
