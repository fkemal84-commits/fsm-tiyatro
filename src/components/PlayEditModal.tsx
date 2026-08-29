'use client';

import { useState, useTransition } from 'react';
import { updatePlay } from '@/lib/actions/content.actions';
import PlayCastEditor, { CastMember, CrewMember } from './PlayCastEditor';
import SmartFileInput from './SmartFileInput';

interface PlayEditModalProps {
  play: any;
}

export default function PlayEditModal({ play }: PlayEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cast, setCast] = useState<CastMember[]>(Array.isArray(play.cast) ? play.cast : []);
  const [crew, setCrew] = useState<CrewMember[]>(Array.isArray(play.crew) ? play.crew : []);
  const [status, setStatus] = useState<string>(play.status || 'UPCOMING');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('playId', play.id);
    formData.append('castJson', JSON.stringify(cast));
    formData.append('crewJson', JSON.stringify(crew));
    formData.append('status', status);

    startTransition(async () => {
      const res = await updatePlay(formData);
      if (res && 'error' in res && res.error) {
        alert(res.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid var(--border-medium)',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    fontSize: '0.85rem',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'var(--text-dim)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.35rem'
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          padding: '0.35rem 0.65rem',
          borderRadius: '6px',
          border: '1px solid var(--border-medium)',
          background: 'transparent',
          color: 'var(--primary-gold)',
          fontSize: '0.75rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
        title="Oyunu Düzenle"
      >
        <ion-icon name="create-outline" /> Düzenle
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div>
                <h3 className="serif-font" style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>
                  Oyunu Düzenle: {play.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '0.25rem 0 0 0' }}>
                  Oyun bilgilerini, afişini, kadrosunu ve durumunu güncelleyin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Durum ve Sezon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Oyun Durumu</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="UPCOMING">⏳ Bu Sezon Sahnelenecek (Hazırlanıyor)</option>
                    <option value="ACTIVE">🎭 Temsil Haftası / Biletler Açık</option>
                    <option value="ARCHIVED">🏛️ Sahnelendi (Arşiv Repertuvarı)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sezon</label>
                  <input
                    type="text"
                    name="season"
                    defaultValue={play.season || ''}
                    placeholder="Örn: 2026–2027 Sezonu"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Başlık ve Tür */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Oyun Adı *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={play.title || ''}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tür</label>
                  <input
                    type="text"
                    name="genre"
                    defaultValue={play.genre || 'Tiyatro Oyunu'}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Yazar ve Yönetmen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Yazar</label>
                  <input
                    type="text"
                    name="playwright"
                    defaultValue={play.playwright || ''}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Yönetmen</label>
                  <input
                    type="text"
                    name="director"
                    defaultValue={play.director || ''}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Açıklama / Konu */}
              <div>
                <label style={labelStyle}>Oyun Açıklaması / Konusu *</label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  defaultValue={play.description || ''}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Yönetmen Notu */}
              <div>
                <label style={labelStyle}>Yönetmen Notu (Opsiyonel)</label>
                <textarea
                  name="directorNote"
                  rows={3}
                  defaultValue={play.directorNote || ''}
                  placeholder="Yönetmenin sahneleme vizyonu ve metne yaklaşımı..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* YouTube Video Linki */}
              <div>
                <label style={labelStyle}>Fragman veya Tam Kayıt Video Linki (YouTube)</label>
                <input
                  type="url"
                  name="videoUrl"
                  defaultValue={play.videoUrl || ''}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={inputStyle}
                />
              </div>

              {/* Afiş ve Senaryo PDF */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '10px' }}>
                <div>
                  <SmartFileInput
                    name="poster"
                    label="Dikey Oyun Afişi Değiştir"
                    maxWidth={900}
                    maxHeight={1350}
                    quality={0.85}
                    helperText={play.posterUrl ? "Mevcut afiş yüklü. Değiştirmek için yeni dosya seçin." : "Örn: 2:3 dikey tiyatro afişi"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Oyun Metni / Senaryo (PDF)</label>
                  <input
                    type="file"
                    name="scriptPdf"
                    accept="application/pdf"
                    style={{ ...inputStyle, padding: '0.4rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.35rem' }}>
                    {play.scriptUrl 
                      ? "✓ Mevcut senaryo yüklü. Oyun arşivlendiğinde herkese açık olur; hazırlanırken sadece kasta özeldir."
                      : "Oyun arşivlendiğinde kütüphaneye dahil edilir."}
                  </span>
                </div>
              </div>

              {/* Kast ve Reji Kadrosu */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <PlayCastEditor
                  initialCast={cast}
                  initialCrew={crew}
                  onChange={({ cast: newCast, crew: newCrew }) => {
                    setCast(newCast);
                    setCrew(newCrew);
                  }}
                />
              </div>

              {/* Kaydet / İptal Butonları */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary-gold)',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    opacity: isPending ? 0.7 : 1
                  }}
                >
                  {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
