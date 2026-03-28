import ScrollReveal from "@/components/ScrollReveal";
import DeleteButton from "@/components/DeleteButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sahnede İz Bırakanlar",
  description: "FSM Tiyatro'nun geçmişten bugüne sergilediği tüm oyunlar ve başarı hikayelerimiz.",
};
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export default async function Plays() {
  const snapshot = await adminDb.collection('plays').orderBy('createdAt', 'desc').get();
  const plays = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
  } as any));

  return (
    <main>
      <header style={{ padding: '12rem 5% 4rem', textAlign: 'center', background: 'radial-gradient(circle at center top, rgba(139,0,0,0.4) 0%, var(--bg-dark) 80%)', borderBottom: 'var(--glass-border)' }}>
        <h1 className="serif-font" style={{ fontSize: '4rem', color: 'var(--primary-gold)', marginBottom: '1rem' }}>Sahnede İz Bırakanlar</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>Kuruluşumuzdan bu yana sahnelediğimiz, üniversitemizde sanatın nabzını tutan seçkin eserlerimiz.</p>
      </header>

      <section className="section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          
          {plays.length === 0 ? (
             <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', gridColumn: '1 / -1' }}>Henüz bir oyun eklenmemiş.</p>
          ) : (
             plays.map(play => (
                <ScrollReveal key={play.id}>
                  <div style={{ background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '12px', overflow: 'hidden', transition: 'var(--transition)' }}>
                    <img src={play.imageUrl || ''} alt={`${play.title} Afiş`} style={{ width: '100%', height: '480px', objectFit: 'cover', borderBottom: 'var(--glass-border)' }} />
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
      </section>
    </main>
  );
}
