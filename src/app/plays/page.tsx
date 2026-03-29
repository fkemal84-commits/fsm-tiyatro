import ScrollReveal from "@/components/ScrollReveal";
import { Metadata } from "next";
import Image from "next/image";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addPlay } from "@/app/actions";

export const metadata: Metadata = {
  title: "Sahnede İz Bırakanlar",
  description: "FSM Tiyatro'nun geçmişten bugüne sergilediği tüm oyunlar ve başarı hikayelerimiz.",
};

export const dynamic = 'force-dynamic';

export default async function Plays() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const canAdd = role === 'SUPERADMIN' || role === 'ADMIN';

  const snapshot = await adminDb.collection('plays').orderBy('createdAt', 'desc').get();
  const plays = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
  } as any));

  return (
    <main>
      <header style={{ padding: '12rem 5% 4rem', textAlign: 'center', background: 'radial-gradient(circle at center top, rgba(139,0,0,0.4) 0%, var(--bg-dark) 80%)', borderBottom: 'var(--glass-border)' }}>
        <ScrollReveal>
          <h1 className="serif-font" style={{ fontSize: '4rem', color: 'var(--primary-gold)', marginBottom: '1rem' }}>Sahnede İz Bırakanlar</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>Kuruluşumuzdan bu yana sahnelediğimiz, üniversitemizde sanatın nabzını tutan seçkin eserlerimiz.</p>
        </ScrollReveal>
      </header>

      <section className="section">
        <ScrollReveal>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* ADMIN OYUN EKLEME FORMU */}
            {canAdd && (
              <div className="glass-card frame-glow" style={{ marginBottom: '4rem', padding: '2.5rem', borderStyle: 'dashed', borderColor: 'var(--primary-gold)' }}>
                 <h2 className="serif-font" style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <ion-icon name="add-circle-outline"></ion-icon> Yeni Oyun Portfolyosu Ekle
                 </h2>
                 <form action={async (fd) => { await addPlay(fd); }} encType="multipart/form-data" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <input 
                        type="text" 
                        name="title" 
                        placeholder="Oyun Adı (Örn: Hamlet)" 
                        style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                        required
                      />
                      <input 
                        type="text" 
                        name="year"
                        placeholder="Sezon (Örn: 2026 SEZONU)" 
                        style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                        required
                      />
                      <input 
                        type="text" 
                        name="videoUrl" 
                        placeholder="YouTube Video Linki (Opsiyonel)" 
                        style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <textarea 
                        name="description"
                        placeholder="Oyun Özeti ve Sanatsal Vizyon..." 
                        rows={5}
                        style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                        required
                      ></textarea>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', opacity: 0.8 }}>Oyun Afişi (Maks. 2MB):</label>
                        <input 
                          type="file" 
                          name="poster" 
                          accept="image/*" 
                          style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} 
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }}>Sisteme İşle ve Yayınla</button>
                    </div>
                 </form>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
            
            {plays.length === 0 ? (
               <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', gridColumn: '1 / -1' }}>Henüz bir oyun eklenmemiş.</p>
            ) : (
               plays.map(play => (
                  <ScrollReveal key={play.id}>
                    <div style={{ background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '12px', overflow: 'hidden', transition: 'var(--transition)' }}>
                      <div style={{ position: 'relative', width: '100%', height: '480px', borderBottom: 'var(--glass-border)' }}>
                        <Image 
                          src={play.imageUrl || '/default-cover.svg'} 
                          alt={`${play.title} Afiş`} 
                          fill 
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, 320px"
                        />
                      </div>
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <span style={{ color: 'var(--primary-gold)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '2px', marginBottom: '0.5rem', display: 'block' }}>{play.year}</span>
                        <h3 className="serif-font" style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem' }}>{play.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>{play.description.length > 100 ? play.description.substring(0, 100) + '...' : play.description}</p>
                        <a href={`/plays/${play.id}`} className="btn btn-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>Detaylar</a>
                      </div>
                    </div>
                  </ScrollReveal>
               ))
            )}

            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
