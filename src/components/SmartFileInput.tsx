'use client';

import { useState, useRef } from 'react';
import { compressImageOnClient } from '@/lib/client-compress';

interface SmartFileInputProps {
  name: string;
  label?: string;
  accept?: string;
  required?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  helperText?: string;
}

export default function SmartFileInput({
  name,
  label,
  accept = 'image/jpeg,image/png,image/webp',
  required = false,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82,
  helperText
}: SmartFileInputProps) {
  const [compressing, setCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const fileHolderRef = useRef<File | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setFileName(file.name);
    setOriginalSize(formatBytes(file.size));

    // Önizleme oluştur
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    try {
      // Tarayıcıda sıkıştır
      const compressed = await compressImageOnClient(file, { maxWidth, maxHeight, quality });
      fileHolderRef.current = compressed;
      setCompressedSize(formatBytes(compressed.size));

      // Sıkıştırılmış dosyayı DataTransfer ile hidden input'a aktar
      if (hiddenInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressed);
        hiddenInputRef.current.files = dataTransfer.files;
      }
    } catch (err) {
      console.warn("Client compression error:", err);
      fileHolderRef.current = file;
    } finally {
      setCompressing(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setFileName(null);
    setOriginalSize(null);
    setCompressedSize(null);
    fileHolderRef.current = null;
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}

      {/* Gerçek Form Inputu (Sıkıştırılmış dosyayı sunucuya taşır) */}
      <input
        ref={hiddenInputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        style={{ display: 'none' }}
      />

      {!previewUrl ? (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px dashed var(--border-medium)',
            borderRadius: '10px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-gold)';
            e.currentTarget.style.color = 'var(--primary-gold)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <ion-icon name="cloud-upload-outline" style={{ fontSize: '1.25rem' }} />
          <span>Görsel Seç veya Sürükle (Boyut sınırı yok, otomatik sıkıştırılır)</span>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
          }}
        >
          {/* Küçük Önizleme */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--border-subtle)',
              background: '#000',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Seçilen Görsel"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Durum ve Boyut Bilgisi */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fileName}
            </div>

            {compressing ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--primary-gold)', marginTop: '0.2rem' }}>
                ⚡ Optimize ediliyor...
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{originalSize}</span>
                <span>➔</span>
                <span style={{ fontWeight: 'bold' }}>{compressedSize}</span>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                  Otomatik Optimize Edildi ✅
                </span>
              </div>
            )}
          </div>

          {/* Kaldır Butonu */}
          <button
            type="button"
            onClick={handleRemove}
            style={{
              padding: '0.4rem 0.75rem',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#f87171',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Kaldır
          </button>
        </div>
      )}

      {helperText && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
}
