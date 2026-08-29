'use client';

import { useState, useRef } from 'react';
import { addPost } from '@/app/actions';
import SmartFileInput from '@/components/SmartFileInput';
import AIReviewHelper from '@/components/AIReviewHelper';

interface PostCreateFormProps {
  authorName: string;
}

export default function PostCreateForm({ authorName }: PostCreateFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Kulis');
  const [keywords, setKeywords] = useState('');
  const [excerpt, setExcerpt] = useState('');

  const inputStyle = "w-full p-3.5 bg-[var(--input-bg)] border border-[var(--border-medium)] rounded-xl text-[var(--text-main)] text-sm focus:border-[var(--primary-gold)] outline-none transition-all";
  const labelStyle = "block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2";

  return (
    <form action={addPost as any} className="space-y-6">
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
          rows={12} 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Yazınızı buraya yazın veya yapıştırın..."
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

      {/* Kapak Görseli ve PDF Eki */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-subtle)]">
        <div>
          <SmartFileInput 
            name="image"
            label="Kapak Görseli"
            maxWidth={1600}
            maxHeight={900}
            quality={0.80}
            helperText="Boyut sınırı yoktur; anında optimize edilir."
          />
        </div>
        <div className="space-y-2">
          <label className={labelStyle}>Ek PDF Belgesi (Makale İçin)</label>
          <input 
            type="file" 
            name="pdf" 
            accept="application/pdf"
            className="w-full text-xs text-[var(--text-muted)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[var(--primary-gold-dim)] file:text-[var(--primary-gold)] hover:file:bg-[var(--primary-gold)] hover:file:text-black cursor-pointer"
          />
          <span className="text-[11px] text-[var(--text-dim)] block">
            Eğer "Makale" kategorisi seçildiyse tam metin PDF Google Scholar'a indekslenir.
          </span>
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

      {/* Gönder Butonu */}
      <div className="pt-4 flex items-center justify-between flex-wrap gap-4 border-t border-[var(--border-subtle)]">
        <span className="text-xs text-[var(--text-dim)]">
          Yazar: <strong className="text-[var(--primary-gold)]">{authorName}</strong>
        </span>
        <button 
          type="submit" 
          className="btn btn-primary py-3.5 px-8 text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:scale-105 transition-all"
        >
          Yazıyı Yayınla
        </button>
      </div>
    </form>
  );
}
