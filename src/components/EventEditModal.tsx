'use client';

import { useState, useTransition } from 'react';
import { updateEvent } from '@/lib/actions/rehearsal.actions';

interface EventEditModalProps {
  event: any;
}

export default function EventEditModal({ event }: EventEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isTicketed, setIsTicketed] = useState<boolean>(Boolean(event.isTicketed));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('eventId', event.id);
    formData.append('isTicketed', isTicketed.toString());

    startTransition(async () => {
      const res = await updateEvent(formData);
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
        title="Etkinliği Düzenle"
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
            maxWidth: '550px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h3 className="serif-font" style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
                Etkinliği Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Etkinlik Adı *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={event.title || ''}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Tarih & Saat *</label>
                  <input
                    type="text"
                    name="date"
                    required
                    defaultValue={event.date || ''}
                    placeholder="25 Mayıs 2026 - 19:30"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tür</label>
                  <select name="type" defaultValue={event.type || 'Etkinlik'} style={inputStyle}>
                    <option value="Etkinlik">Etkinlik</option>
                    <option value="Tiyatro Gezisi">Tiyatro Gezisi</option>
                    <option value="Sinema Buluşması">Sinema Buluşması</option>
                    <option value="Atölye">Atölye</option>
                    <option value="Prova">Genel Prova</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Konum</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={event.location || ''}
                  placeholder="Haliç Yerleşkesi / Şehir Tiyatroları"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Açıklama</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={event.description || ''}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Biletli Etkinlik */}
              <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={isTicketed}
                    onChange={(e) => setIsTicketed(e.target.checked)}
                  />
                  <span>🎟️ Üyelere Özel Biletli / Kontenjanlı Etkinlik</span>
                </label>

                {isTicketed && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={labelStyle}>Toplam Kontenjan</label>
                    <input
                      type="number"
                      name="ticketQuota"
                      min={1}
                      defaultValue={event.ticketQuota || 30}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-gold)', color: '#000', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? 'Kaydediliyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
