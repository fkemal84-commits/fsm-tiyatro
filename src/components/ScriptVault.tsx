'use client';

import { useState } from 'react';
import { uploadScript, deleteScript } from '@/app/actions';

interface Script {
  id: string;
  title: string;
  fileUrl: string;
  author: string;
  createdAt: string;
}

export default function ScriptVault({ initialScripts, canManage }: { initialScripts: Script[], canManage: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const res = await uploadScript(formData);
    
    if (res?.error) setError(res.error);
    else (e.target as HTMLFormElement).reset();
    
    setLoading(false);
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <h2 className="text-[var(--text-main)] text-2xl mb-8 border-b border-[var(--border-subtle)] pb-4 flex items-center gap-3 font-bold">
        <ion-icon name="library-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
        Senaryo Kütüphanesi
      </h2>

      {canManage && (
        <form onSubmit={handleUpload} className="mb-10 bg-[var(--primary-gold-dim)] p-6 rounded-2xl border border-dashed border-[var(--primary-gold-border)]">
          <h4 className="text-[var(--primary-gold)] text-xs font-bold uppercase tracking-widest mb-4">Yeni Metin Yükle</h4>
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              name="title" 
              placeholder="Oyun veya Senaryo Adı" 
              className="p-3 rounded-lg bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-medium)] focus:border-[var(--primary-gold)] w-full outline-none text-sm"
              required 
            />
            <div className="flex flex-wrap items-center gap-4">
              <input 
                type="file" 
                name="file" 
                accept="application/pdf" 
                className="text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary-gold)] file:text-black hover:file:bg-[var(--primary-gold-light)] transition-all cursor-pointer"
                required 
              />
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary text-xs py-2 px-6 ml-auto"
              >
                {loading ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>
          </div>
          {error && <p className="text-[var(--accent-crimson)] text-xs mt-3 font-bold">{error}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
        {initialScripts.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-dim)] italic">
            <ion-icon name="document-outline" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}></ion-icon>
            <p>Henüz yüklenmiş bir metin bulunmuyor.</p>
          </div>
        ) : (
          initialScripts.map((s) => (
            <div key={s.id} className="group p-5 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 min-w-[3rem] rounded-lg bg-[var(--primary-gold-dim)] flex items-center justify-center text-[var(--primary-gold)] text-2xl border border-[var(--primary-gold-border)]">
                  <ion-icon name="document-text"></ion-icon>
                </div>
                <div>
                  <h3 className="text-[var(--text-main)] font-bold group-hover:text-[var(--primary-gold)] transition-colors leading-tight">{s.title}</h3>
                  <p className="text-[var(--text-dim)] text-[11px] uppercase tracking-wider mt-1">
                    {s.author} • {new Date(s.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto justify-end border-t border-[var(--border-subtle)] pt-4 sm:border-0 sm:pt-0">
                <a 
                  href={s.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-medium)] text-[var(--text-main)] hover:bg-[var(--primary-gold)] hover:text-black flex items-center justify-center transition-all text-xl"
                  title="Görüntüle / İndir"
                >
                  <ion-icon name="cloud-download-outline"></ion-icon>
                </a>
                
                {canManage && (
                  <button 
                    onClick={async () => {
                      if (confirm('Bu senaryoyu kütüphaneden kalıcı olarak silmek istediğinize emin misiniz?')) {
                        const formData = new FormData();
                        formData.append('scriptId', s.id);
                        await deleteScript(formData);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-medium)] text-[var(--text-dim)] hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444] flex items-center justify-center transition-all text-xl cursor-pointer"
                    title="Sil"
                  >
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
