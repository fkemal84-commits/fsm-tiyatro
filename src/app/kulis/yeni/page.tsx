import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { addPost } from "@/app/actions";
import SmartFileInput from "@/components/SmartFileInput";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Yazı Ekle | FSM Tiyatro Kulis",
  description: "Kulis, Blog ve Akademik Makale yayınlama editörü.",
};

import { adminDb } from "@/lib/firebase-admin";

export default async function YeniYaziPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?callbackUrl=/kulis/yeni');
  }

  const role = (session.user as any)?.role;
  const userTitles: string[] = (session.user as any)?.titles || [];
  let canWrite = ['EDITOR', 'ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(role) ||
    userTitles.some((t: string) => t.includes('Editör') || t.includes('Yazar') || t.includes('Yönetmen') || t.includes('Admin'));

  if (!canWrite && session.user.email) {
    try {
      const uSnap = await adminDb.collection('users').where('email', '==', session.user.email.toLowerCase()).limit(1).get();
      if (!uSnap.empty) {
        const uData = uSnap.docs[0].data();
        const dbRole = uData.role;
        const dbTitles: string[] = uData.titles || [];
        if (['EDITOR', 'ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(dbRole) || dbTitles.some((t: string) => t.includes('Editör') || t.includes('Yazar') || t.includes('Yönetmen') || t.includes('Admin'))) {
          canWrite = true;
        }
      }
    } catch {}
  }

  if (!canWrite) {
    redirect('/kulis');
  }

  const inputStyle = "w-full p-3.5 bg-[var(--input-bg)] border border-[var(--border-medium)] rounded-xl text-[var(--text-main)] text-sm focus:border-[var(--primary-gold)] outline-none transition-all";
  const labelStyle = "block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2";

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Geri Butonu */}
        <Link 
          href="/kulis"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary-gold)] mb-6 transition-colors"
        >
          <ion-icon name="arrow-back-outline"></ion-icon>
          <span>Kulis Yazılarına Dön</span>
        </Link>

        {/* Editör Kartı */}
        <div className="editorial-card p-6 sm:p-10 bg-[var(--bg-surface)] space-y-8">
          <div className="border-b border-[var(--border-subtle)] pb-6">
            <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">
              YAZAR & EDİTÖR MASASI
            </span>
            <h1 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">
              Yeni Kulis & Makale Yazısı
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 font-light">
              Tiyatro incelemelerinizi, kulis günlüklerinizi veya akademik makalelerinizi doğrudan yayınlayın.
            </p>
          </div>

          <form action={addPost as any} className="space-y-6">
            {/* Başlık ve Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelStyle}>Yazı Başlığı *</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  placeholder="Örn: Hamlet'te Delilik ve İktidar Paradoksu"
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Kategori *</label>
                <select 
                  name="category" 
                  defaultValue="Kulis"
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
                placeholder="Yazınızı buraya yazın veya yapıştırın..."
                className={`${inputStyle} resize-y leading-relaxed font-serif`}
              ></textarea>
            </div>

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
                placeholder="tiyatro, dramaturgi, sahne sanatları, hamlet, sahne tasarımı"
                className={inputStyle}
              />
            </div>

            {/* Gönder Butonu */}
            <div className="pt-4 flex items-center justify-between flex-wrap gap-4 border-t border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-dim)]">
                Yazar: <strong className="text-[var(--primary-gold)]">{session.user.name || session.user.email}</strong>
              </span>
              <button 
                type="submit" 
                className="btn btn-primary py-3.5 px-8 text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg hover:scale-105 transition-all"
              >
                Yazıyı Yayınla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
