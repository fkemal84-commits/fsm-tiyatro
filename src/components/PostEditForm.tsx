'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { updatePost } from '@/app/actions';
import SmartFileInput from '@/components/SmartFileInput';
import AIReviewHelper from '@/components/AIReviewHelper';
import { formatAuthorSignature } from '@/lib/utils';

interface PostEditFormProps {
  post: {
    id: string;
    title: string;
    content: string;
    category?: string;
    excerpt?: string;
    imageUrl?: string | null;
    author?: string;
    authorEmail?: string;
    academicMeta?: {
      isAcademic?: boolean;
      abstract?: string;
      keywords?: string[];
      pdfUrl?: string | null;
      journalTitle?: string;
      authorAffiliation?: string;
    } | null;
  };
}

export default function PostEditForm({ post }: PostEditFormProps) {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [category, setCategory] = useState(post.category || 'Kulis');
  const [excerpt, setExcerpt] = useState(post.excerpt || '');
  const [keywords, setKeywords] = useState(
    Array.isArray(post.academicMeta?.keywords) ? post.academicMeta!.keywords.join(', ') : ''
  );

  const inputStyle = "w-full p-3.5 bg-[var(--input-bg)] border border-[var(--border-medium)] rounded-xl text-[var(--text-main)] text-sm focus:border-[var(--primary-gold)] outline-none transition-all";
  const labelStyle = "block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2";

  return (
    <form action={updatePost as any} className="space-y-6">
      <input type="hidden" name="postId" value={post.id} />

      {/* Başlık ve Kategori */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className={labelStyle}>Yazı Başlığı *</label>
          <input 
            type="text" 
            name="title" 
            required 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Hamlet'te Delilik ve İktidar Paradoksu"
            className={inputStyle}
          />
        </div>
        <div>
          <label className={labelStyle}>Kategori *</label>
          <select 
            name="category" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputStyle}
          >
            <option value="Kulis">Kulis (Kulüp İçi)</option>
            <option value="Blog">Blog (Tiyatro Güncesi)</option>
            <option value="Makale">Makale (Akademik & Scholar)</option>
            <option value="Haber">Haber & Duyuru</option>
          </select>
        </div>
      </div>

      {/* Kısa Özet (Excerpt / Abstract) */}
      <div>
        <label className={labelStyle}>Kısa Özet / Abstract (Google ve Listeler İçin)</label>
        <input 
          type="text" 
          name="excerpt" 
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Yazının ana fikrini özetleyen 1-2 cümlelik tanıtım..."
          className={inputStyle}
        />
      </div>

      {/* İçerik Metni */}
      <div>
        <label className={labelStyle}>Yazı İçeriği *</label>
        <textarea 
          name="content" 
          required 
          rows={14} 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Yazınızı buraya yazın..."
          className={`${inputStyle} resize-y leading-relaxed font-serif`}
        ></textarea>
      </div>

      {/* Yapay Zeka Metin İnceleme Asistanı */}
      <AIReviewHelper
        getTitle={() => title}
        getContent={() => content}
        getCategory={() => category}
        onApplyTitle={(suggestedTitle) => setTitle(suggestedTitle)}
        onApplyKeywords={(suggestedKeywords) => {
          setKeywords(prev => prev ? `${prev}, ${suggestedKeywords}` : suggestedKeywords);
        }}
      />

      {/* Kapak Görseli ve Mevcut Görsel Önizleme */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
        {post.imageUrl && (
          <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
            <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-2">
              Mevcut Kapak Görseli
            </span>
            <div className="relative w-full max-w-sm aspect-[16/9] rounded-lg overflow-hidden border border-[var(--border-subtle)]">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 384px"
              />
            </div>
            <p className="text-[11px] text-[var(--text-dim)] mt-2">
              Değiştirmek istemiyorsanız aşağıdaki görsel alanını boş bırakabilirsiniz.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <SmartFileInput 
              name="image"
              label={post.imageUrl ? "Yeni Kapak Görseli Yükle (Opsiyonel)" : "Kapak Görseli"}
              maxWidth={1600}
              maxHeight={900}
              quality={0.80}
              helperText="Boyut sınırı yoktur; anında optimize edilir."
            />
          </div>
          <div className="space-y-2">
            <label className={labelStyle}>Ek PDF Belgesi (Makale İçin)</label>
            {post.academicMeta?.pdfUrl && (
              <div className="mb-2 text-xs text-[var(--primary-gold)]">
                📄 Mevcut PDF yüklü. Değiştirmek için yeni dosya seçebilirsiniz.
              </div>
            )}
            <input 
              type="file" 
              name="pdf" 
              accept="application/pdf"
              className="w-full text-xs text-[var(--text-muted)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[var(--primary-gold-dim)] file:text-[var(--primary-gold)] hover:file:bg-[var(--primary-gold)] hover:file:text-black cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Anahtar Kelimeler */}
      <div>
        <label className={labelStyle}>Anahtar Kelimeler (Virgülle Ayırın)</label>
        <input 
          type="text" 
          name="keywords" 
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="tiyatro, dramaturgi, sahne sanatları, hamlet, sahne tasarımı"
          className={inputStyle}
        />
      </div>

      {/* Gönder ve İptal Butonları */}
      <div className="pt-4 flex items-center justify-between flex-wrap gap-4 border-t border-[var(--border-subtle)]">
        <span className="text-xs text-[var(--text-dim)]">
          İmza: <strong className="text-[var(--primary-gold)]">{formatAuthorSignature(post.author)}</strong>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href={`/kulis/${post.id}`}
            className="px-5 py-3 rounded-xl border border-[var(--border-medium)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            İptal
          </Link>
          <button 
            type="submit" 
            className="btn btn-primary py-3.5 px-8 text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:scale-105 transition-all"
          >
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </form>
  );
}
