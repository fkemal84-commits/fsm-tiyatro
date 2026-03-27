import { addPost, addPlay, changeUserRole } from '@/app/actions';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/login');
  
  const role = (session.user as any).role;
  // Sadece yetkililer girebilir (Superadmin, Admin, Editör)
  if (role !== 'SUPERADMIN' && role !== 'ADMIN' && role !== 'EDITOR') {
    redirect('/');
  }

  // Veritabanından tüm üyeleri çek
  const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <h1 className="serif-font" style={{ fontSize: '3rem', color: 'var(--primary-gold)', marginBottom: '2rem', textAlign: 'center' }}>
        {role === 'EDITOR' ? 'İçerik Stüdyosu' : 'Ana Kontrol ve Yönetim Paneli'}
      </h1>
      
      {/* ÜYE LİSTESİ - SADECE ADMIN VE SUPERADMIN GÖREBİLİR */}
      {(role === 'SUPERADMIN' || role === 'ADMIN') && (
        <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto 2rem', padding: '2rem' }}>
          <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>👥 Kulüp Üye ve Personel Listesi</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', color: '#fff', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <th style={{ padding: '0.8rem 1rem' }}>Ad Soyad</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Yetki Sınıfı</th>
                  <th style={{ padding: '0.8rem 1rem' }}>E-Posta Adresi</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Telefon</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Bölümü</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>Profil</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const canEdit = 
                    (role === 'SUPERADMIN') || 
                    (role === 'ADMIN' && u.role !== 'SUPERADMIN' && u.role !== 'ADMIN');

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s', cursor: 'default' }} className="user-row">
                      <td style={{ padding: '1rem' }}>{u.name} {u.surname}</td>
                      <td style={{ padding: '1rem' }}>
                        {canEdit ? (
                          <form action={changeUserRole} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="hidden" name="userId" value={u.id} />
                            <select name="newRole" defaultValue={u.role} style={{ padding: '0.4rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: u.role === 'SUPERADMIN' ? '#ff4d4d' : u.role === 'ADMIN' ? 'var(--primary-gold)' : '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                              {role === 'SUPERADMIN' && <option value="SUPERADMIN">SUPERADMIN</option>}
                              {role === 'SUPERADMIN' && <option value="ADMIN">ADMIN</option>}
                              <option value="EDITOR">İÇERİK EDİTÖRÜ</option>
                              <option value="MEMBER">MEMBER</option>
                            </select>
                            <button type="submit" className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--text-muted)' }}>Mührü Ver</button>
                          </form>
                        ) : (
                          <span style={{ color: u.role === 'SUPERADMIN' ? '#ff4d4d' : u.role === 'ADMIN' ? 'var(--primary-gold)' : 'var(--text-muted)', fontWeight: 'bold' }}>{u.role === 'EDITOR' ? 'İÇERİK EDİTÖRÜ' : u.role}</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>{u.email}</td>
                      <td style={{ padding: '1rem' }}>{u.phone || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--primary-gold)' }}>{u.department || 'Belirtilmedi'}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                         <a href={`/tanerabi/users/${u.id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'inline-block' }}>İncele</a>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Mevcut üye bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Blog Ekleme Formu - EDİTÖR, ADMIN VE SUPERADMIN GÖREBİLİR */}
        <div className="glass-card">
          <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Yeni Blog Yazısı Ekle</h2>
          <form action={addPost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              name="title"
              placeholder="Yazı Başlığı" 
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
              required
            />
            <textarea 
              name="content"
              placeholder="Yazının Gövdesi..." 
              rows={5}
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
              required
            ></textarea>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Yayınla ve Siteyi Güncelle</button>
          </form>
        </div>

        {/* Oyun Ekleme Formu - SADECE ADMIN VE SUPERADMIN GÖREBİLİR */}
        {(role === 'SUPERADMIN' || role === 'ADMIN') && (
          <div className="glass-card">
            <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Sahnede İz Bırakanlar'a Oyun Ekle</h2>
            <form action={addPlay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                name="title"
                placeholder="Oyun Adı (Örn: Hamlet)" 
                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                required
              />
               <input 
                type="text" 
                name="year"
                placeholder="Sezon (Örn: 2026 SEZONU)" 
                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                required
              />
              <textarea 
                name="description"
                placeholder="Oyun Özeti..." 
                rows={3}
                style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                required
              ></textarea>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Oyunu Portfolyoya Ekle</button>
            </form>
          </div>
        )}
        
      </div>
    </div>
  );
}
