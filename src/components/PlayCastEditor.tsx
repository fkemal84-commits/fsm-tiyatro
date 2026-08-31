'use client';

import { useState } from 'react';

export interface CastMember {
  actorName: string;
  roleName: string;
  photoUrl?: string;
  userEmail?: string;
  email?: string;
  userId?: string;
  actorId?: string;
}

export interface CrewMember {
  name?: string;
  memberName?: string;
  task?: string;
  duty?: string;
  photoUrl?: string;
}

export interface PlayCastEditorProps {
  initialCast?: CastMember[];
  initialCrew?: CrewMember[];
  onChange?: (data: { cast: CastMember[]; crew: CrewMember[] }) => void;
}

export default function PlayCastEditor({ initialCast = [], initialCrew = [], onChange }: PlayCastEditorProps) {
  const [cast, setCast] = useState<CastMember[]>(initialCast);
  const [crew, setCrew] = useState<CrewMember[]>(initialCrew);

  // Cast input states
  const [actorName, setActorName] = useState('');
  const [roleName, setRoleName] = useState('');

  // Crew input states
  const [crewName, setCrewName] = useState('');
  const [crewTask, setCrewTask] = useState('');

  const handleAddCast = () => {
    if (!actorName.trim() || !roleName.trim()) return;
    const next = [...cast, { actorName: actorName.trim(), roleName: roleName.trim() }];
    setCast(next);
    onChange?.({ cast: next, crew });
    setActorName('');
    setRoleName('');
  };

  const handleRemoveCast = (index: number) => {
    const next = cast.filter((_, i) => i !== index);
    setCast(next);
    onChange?.({ cast: next, crew });
  };

  const handleAddCrew = () => {
    if (!crewName.trim() || !crewTask.trim()) return;
    const next = [...crew, { name: crewName.trim(), task: crewTask.trim() }];
    setCrew(next);
    onChange?.({ cast, crew: next });
    setCrewName('');
    setCrewTask('');
  };

  const handleRemoveCrew = (index: number) => {
    const next = crew.filter((_, i) => i !== index);
    setCrew(next);
    onChange?.({ cast, crew: next });
  };

  const inputStyle = {
    padding: '0.6rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid var(--border-medium)',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    fontSize: '0.8rem',
    outline: 'none'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
      <input type="hidden" name="castJson" value={JSON.stringify(cast)} />
      <input type="hidden" name="crewJson" value={JSON.stringify(crew)} />

      {/* 1. OYUNCULAR (CAST) BÖLÜMÜ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary-gold)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🎭 Oyuncu Kadrosu (Kast) ({cast.length})
          </label>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Oyun bazlı oyuncu ve karakter eşleştirmesi</span>
        </div>

        {/* Mevcut Oyuncular Listesi */}
        {cast.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {cast.map((item, idx) => (
              <span
                key={idx}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.12)',
                  color: 'var(--text-main)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <strong>{item.actorName}</strong>
                <span style={{ color: 'var(--primary-gold)', fontStyle: 'italic' }}>({item.roleName})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCast(idx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary-gold)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    padding: '0 0.1rem'
                  }}
                  title="Oyuncuyu Çıkar"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic', margin: '0 0 0.75rem 0' }}>
            Henüz oyuncu eklenmedi. Aşağıdan oyuncu ve rolünü ekleyebilirsiniz.
          </p>
        )}

        {/* Oyuncu Ekleme Alanı */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Oyuncu Adı Soyadı (Örn: Ali Yılmaz)"
            value={actorName}
            onChange={(e) => setActorName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Karakter / Rol (Örn: Hamlet, Polonius)"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCast();
              }
            }}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleAddCast}
            disabled={!actorName.trim() || !roleName.trim()}
            style={{
              padding: '0.6rem 1rem',
              background: 'var(--primary-gold)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              opacity: (!actorName.trim() || !roleName.trim()) ? 0.5 : 1
            }}
          >
            + Oyuncu Ekle
          </button>
        </div>
      </div>

      {/* 2. REJİ & SAHNE ARKASI (CREW) BÖLÜMÜ */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🎬 Reji & Sahne Arkası Ekibi ({crew.length})
          </label>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Dekor, Işık, Ses, Kostüm, Dramaturg</span>
        </div>

        {/* Mevcut Crew Listesi */}
        {crew.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {crew.map((item, idx) => (
              <span
                key={idx}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-medium)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <strong>{item.name}</strong>
                <span style={{ color: 'var(--text-muted)' }}>({item.task})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCrew(idx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    padding: '0 0.1rem'
                  }}
                  title="Kişiyi Çıkar"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic', margin: '0 0 0.75rem 0' }}>
            Reji veya sahne arkası görevlisi eklenmedi.
          </p>
        )}

        {/* Ekip Ekleme Alanı */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Kişi Adı Soyadı (Örn: Ayşe Demir)"
            value={crewName}
            onChange={(e) => setCrewName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Görevi (Örn: Işık & Ses Tasarımı, Sahne Amiri)"
            value={crewTask}
            onChange={(e) => setCrewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCrew();
              }
            }}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleAddCrew}
            disabled={!crewName.trim() || !crewTask.trim()}
            style={{
              padding: '0.6rem 1rem',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              opacity: (!crewName.trim() || !crewTask.trim()) ? 0.5 : 1
            }}
          >
            + Görevli Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
