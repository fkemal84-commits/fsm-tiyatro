'use client';

import { useState } from 'react';
import { updateSiteConfig } from '@/app/actions';
import { useRouter } from 'next/navigation';
import SmartFileInput from '@/components/SmartFileInput';

interface SiteConfigFormProps {
  siteConfig: any;
}

export default function SiteConfigForm({ siteConfig }: SiteConfigFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(siteConfig?.heroImageUrl || null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await updateSiteConfig(formData);
      if (res?.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({ type: 'success', text: '✓ Hero arka plan görseli ve site yapılandırması başarıyla kaydedildi!' });
        router.refresh();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Kayıt sırasında hata oluştu: ' + (err?.message || err) });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-medium)',
    fontSize: '0.875rem',
    width: '100%',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    fontWeight: 'bold',
    marginBottom: '0.35rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
      <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Site Yapılandırması</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
        Ana sayfa hero görseli, başlıkları ve iletişim bilgilerini buradan güncelleyin. Değişiklikler anında canlıya yansır.
      </p>

      {message && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: '500',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: message.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <SmartFileInput
            name="heroImage"
            label="Hero Arka Plan Görseli Yükle"
            maxWidth={1920}
            maxHeight={1080}
            quality={0.82}
            helperText="Seçtiğiniz görsel otomatik olarak tam ekran boyutuna optimize edilerek işlenir."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Hero Banner Başlığı</label>
            <input
              type="text"
              name="heroTitle"
              defaultValue={siteConfig?.heroTitle || ''}
              placeholder="FSM Tiyatro"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>İletişim / Sponsorluk E-Postası</label>
            <input
              type="email"
              name="contactEmail"
              defaultValue={siteConfig?.contactEmail || 'info@fsmtiyatro.com'}
              placeholder="info@fsmtiyatro.com"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Hero Banner Alt Açıklaması</label>
          <input
            type="text"
            name="heroSubtitle"
            defaultValue={siteConfig?.heroSubtitle || ''}
            placeholder="Fatih Sultan Mehmet Vakıf Üniversitesi Tiyatro Kulübü..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>İsteğe Bağlı: Harici Görsel Linki (URL)</label>
          <input
            type="url"
            name="heroImageUrl"
            defaultValue={siteConfig?.heroImageUrl?.startsWith('data:') ? '' : (siteConfig?.heroImageUrl || '')}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.85rem 2rem',
            background: 'var(--primary-gold)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <>
              <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Görsel İşleniyor & Kaydediliyor...
            </>
          ) : (
            'Kaydet ve Yayınla'
          )}
        </button>
      </form>
    </div>
  );
}
