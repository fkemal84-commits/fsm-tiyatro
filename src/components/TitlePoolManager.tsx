'use client';

import { useState, useTransition } from 'react';
import { addAvailableTitle, removeAvailableTitle } from '@/app/actions';

interface TitlePoolManagerProps {
  initialTitles: string[];
}

export default function TitlePoolManager({ initialTitles = [] }: TitlePoolManagerProps) {
  const [titles, setTitles] = useState<string[]>(initialTitles);
  const [newTitle, setNewTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    if (titles.includes(trimmed)) {
      setErrorMsg("Bu unvan zaten havuzda mevcut.");
      return;
    }

    setErrorMsg('');
    const nextTitles = [...titles, trimmed];
    setTitles(nextTitles);
    setNewTitle('');

    const formData = new FormData();
    formData.append('title', trimmed);

    startTransition(async () => {
      const res = await addAvailableTitle(formData);
      if ('error' in res && res.error) {
        setErrorMsg(res.error);
        setTitles(titles); // revert
      }
    });
  };

  const handleRemove = (titleToRemove: string) => {
    if (!confirm(`"${titleToRemove}" unvanını sistem havuzundan tamamen silmek istediğinize emin misiniz?`)) return;

    setErrorMsg('');
    const nextTitles = titles.filter(t => t !== titleToRemove);
    setTitles(nextTitles);

    startTransition(async () => {
      const res = await removeAvailableTitle(titleToRemove);
      if ('error' in res && res.error) {
        setErrorMsg(res.error);
        setTitles(titles); // revert
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Mevcut Unvan Havuzu */}
      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.5rem', 
          padding: '0.85rem', 
          background: 'var(--bg-surface-elevated)', 
          borderRadius: '10px', 
          border: '1px solid var(--border-subtle)',
          minHeight: '48px',
          alignItems: 'center'
        }}
      >
        {titles.map((t, i) => (
          <span
            key={i}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: 'rgba(212, 175, 55, 0.12)',
              color: 'var(--primary-gold)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s'
            }}
          >
            <span>{t}</span>
            <button
              type="button"
              onClick={() => handleRemove(t)}
              title={`"${t}" unvanını havuzdan sil`}
              disabled={isPending}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-gold)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                lineHeight: 1,
                padding: '0 0.1rem',
                opacity: 0.75,
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
            >
              ×
            </button>
          </span>
        ))}
        {titles.length === 0 && (
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Henüz tanımlı unvan bulunmuyor.
          </span>
        )}
      </div>

      {errorMsg && (
        <p style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', margin: 0 }}>
          {errorMsg}
        </p>
      )}

      {/* Yeni Unvan Ekleme Formu */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', maxWidth: '480px' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Yeni unvan yaz (Örn: Dramaturg, Sahne Amiri)..."
          disabled={isPending}
          required
          style={{
            padding: '0.6rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid var(--border-medium)',
            background: 'var(--input-bg)',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            flex: 1,
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isPending || !newTitle.trim()}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'var(--primary-gold)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            opacity: isPending ? 0.6 : 1
          }}
        >
          {isPending ? 'İşleniyor...' : '+ Havuza Ekle'}
        </button>
      </form>
    </div>
  );
}
