import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { addRehearsal, addTeamNeed } from "@/app/actions";

export default async function MembersDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const canAdd = role === 'ADMIN' || role === 'SUPERADMIN';

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
  const rehearsals = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const teamNeedsSnapshot = await adminDb.collection('teamNeeds').where('isActive', '==', true).get();
  const teamNeeds = teamNeedsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="serif-font" style={{ fontSize: '3rem', color: 'var(--primary-gold)', marginBottom: '1rem' }}>Üye Panosu</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {session ? (
            <>Hoş geldin, <span style={{ color: '#fff', fontWeight: 'bold' }}>{session.user?.name || session.user?.email}</span>!</>
          ) : (
            <>FSM Vakıf Üniversitesi Sinema ve Tiyatro Kulübü <span style={{ color: '#fff', fontWeight: 'bold' }}>Dijital Panosu</span></>
          )}
          <br/> 
          Sadece üyelere özel prova saatleri ve ekip ihtiyaçları aşağıdadır.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* PROVALAR KARTI */}
        <div className="glass-card">
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            🎭 Yaklaşan Provalar
          </h2>
          
          {/* Admin / Superadmin'e Özel Form */}
          {canAdd && (
            <form action={addRehearsal} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px dashed var(--primary-gold)' }}>
              <h4 style={{ color: 'var(--primary-gold)', fontSize: '0.95rem' }}>+ Yeni Prova Ekle (Yönetici Yetkisi)</h4>
              <input type="text" name="title" placeholder="Prova Konusu (Örn: Hamlet Prömiyer Provası)" style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none' }} required />
              <input type="text" name="date" placeholder="Tarih & Saat" style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none' }} required />
              <input type="text" name="location" placeholder="Konum (Sınıf, Sahne)" style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none' }} required />
              <input type="text" name="notes" placeholder="Üyelere Ek Notlar (Opsiyonel)" style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none' }} />
              <button type="submit" className="btn btn-outline" style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8.5rem', borderColor: 'var(--primary-gold)', color: 'var(--primary-gold)' }}>Üyelere Yayınla</button>
            </form>
          )}

          {rehearsals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Henüz planlanmış bir prova takvimi girilmemiş.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rehearsals.map((r: any) => (
                <li key={r.id} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--primary-gold)', marginBottom: '0.3rem', fontSize: '1.1rem' }}>📌 {r.title}</h4>
                  <div style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.3rem' }}>⏰ {r.date}</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.5rem' }}>📍 {r.location}</div>
                  {r.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not: {r.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CADI KARTI / İHTİYAÇLAR */}
        <div className="glass-card">
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            🤝 Ekip İhtiyaç İlanları
          </h2>

          {/* Admin / Superadmin'e Özel Form */}
          {canAdd && (
             <form action={addTeamNeed} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.8rem', border: '1px dashed var(--primary-gold)' }}>
             <h4 style={{ color: 'var(--primary-gold)', fontSize: '0.95rem' }}>+ Yeni Personel Açığı Ekle (Yönetici Yetkisi)</h4>
             <input type="text" name="roleName" placeholder="Aranan Yetenek (Örn: Işıkçı, Dekor)" style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none' }} required />
             <textarea name="description" placeholder="Ne arıyoruz, ekip üyelerinden beklentimiz nedir?" rows={3} style={{ padding: '0.8rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none' }} required></textarea>
             <button type="submit" className="btn btn-outline" style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8.5rem', borderColor: 'var(--primary-gold)', color: 'var(--primary-gold)' }}>İlanı Panoya Çıkart</button>
           </form>
          )}

          {teamNeeds.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Şu an için açık bir ekip personel ilanı yok.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teamNeeds.map((t: any) => (
                <li key={t.id} style={{ marginBottom: '1rem', padding: '1.2rem', background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.15rem' }}>🎯 {t.roleName} Aranıyor!</h4>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{t.description}</p>
                  <button className="btn btn-outline" style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', fontSize: '0.8rem', width: '100%' }}>Ekibe Katılmak İçin Başvur</button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
