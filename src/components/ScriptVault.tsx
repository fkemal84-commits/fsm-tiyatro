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
      <h2 className="text-white text-2xl mb-8 border-b border-white/10 pb-4 flex items-center gap-3">
        <ion-icon name="library-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
        Senaryo Kütüphanesi
      </h2>

      {canManage && (
        <form onSubmit={handleUpload} className="mb-10 bg-white/5 p-6 rounded-2xl border border-dashed border-[var(--primary-gold)]">
          <h4 className="text-[var(--primary-gold)] text-xs font-bold uppercase tracking-widest mb-4">Yeni Metin Yükle</h4>
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              name="title" 
              placeholder="Oyun veya Senaryo Adı" 
              className="p-3 rounded-lg bg-black/40 text-white border-white/10 focus:ring-1 focus:ring-[var(--primary-gold)] w-full"
              required 
            />
            <div className="flex gap-4">
              <input 
                type="file" 
                name="file" 
                accept="application/pdf" 
                className="text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary-gold)] file:text-black hover:file:bg-white transition-all cursor-pointer"
                required 
              />
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary text-xs py-2 px-6 ml-auto"
              >
                {loading ? 'YÜKLENİYOR...' : 'YÜKLE'}
              </button>
            </div>
          </div>
          {error && <p className="text-[var(--accent-red)] text-xs mt-3 font-bold">{error}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
        {initialScripts.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] italic">
            <ion-icon name="document-outline" style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem' }}></ion-icon>
            <p>Henüz yüklenmiş bir metin bulunmuyor.</p>
          </div>
        ) : (
          initialScripts.map((s) => (
            <div key={s.id} className="group p-5 bg-white/5 rounded-xl border border-white/10 hover:border-[var(--primary-gold)] transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-900/20 flex items-center justify-center text-red-500 text-2xl border border-red-500/20">
                  <ion-icon name="document-text"></ion-icon>
                </div>
                <div>
                  <h3 className="text-white font-bold group-hover:text-[var(--primary-gold)] transition-colors">{s.title}</h3>
                  <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-tighter mt-1">
                    {s.author} • {new Date(s.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <a 
                  href={s.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[var(--primary-gold)] hover:text-black flex items-center justify-center transition-all text-xl"
                  title="Görüntüle / İndir"
                >
                  <ion-icon name="cloud-download-outline"></ion-icon>
                </a>
                
                {canManage && (
                  <button 
                    onClick={async () => {
                      if (confirm('Bu senaryoyu kütüphaneden kalıcı olarak silmek istediğine emin misin?')) {
                        const formData = new FormData();
                        formData.append('scriptId', s.id);
                        await deleteScript(formData);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-[var(--accent-red)] text-white/40 hover:text-white flex items-center justify-center transition-all text-xl"
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
