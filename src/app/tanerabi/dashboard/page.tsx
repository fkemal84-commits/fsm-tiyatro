import { addPost, addPlay, changeUserRole, deletePost, deletePlay, approveUser } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) redirect('/login');
    
    const role = (session.user as any).role;
    // Sadece yetkililer girebilir (Superadmin, Admin, Editör)
    if (role !== 'SUPERADMIN' && role !== 'ADMIN' && role !== 'EDITOR') {
      redirect('/');
    }

    // Veritabanından tüm üyeleri çek
    const usersSnapshot = await adminDb.collection('users').get();
    const users = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Mevcut içerikleri çek
    const postsSnapshot = await adminDb.collection('posts').get();
    const posts = postsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const playsSnapshot = await adminDb.collection('plays').get();
    const plays = playsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Onay bekleyen kullanıcıları filtrele
    const pendingUsers = users.filter((u: any) => u.role === 'PENDING');
    const approvedUsers = users.filter((u: any) => u.role !== 'PENDING');

    return (
      <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <h1 className="serif-font" style={{ fontSize: '3rem', color: 'var(--primary-gold)', marginBottom: '2rem', textAlign: 'center' }}>
          {role === 'EDITOR' ? 'İçerik Stüdyosu' : 'Ana Kontrol ve Yönetim Paneli'}
        </h1>

        {/* ONAY BEKLEYENLER - SADECE ADMIN VE SUPERADMIN GÖREBİLİR */}
        {(role === 'SUPERADMIN' || role === 'ADMIN') && pendingUsers.length > 0 && (
          <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto 2rem', padding: '2rem', borderColor: 'var(--primary-gold)', borderStyle: 'dashed' }}>
            <h2 style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <ion-icon name="time-outline"></ion-icon> Onay Bekleyen Kullanıcılar (Dış Mail)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', color: '#fff', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    <th style={{ padding: '0.8rem 1rem' }}>Ad Soyad</th>
                    <th style={{ padding: '0.8rem 1rem' }}>E-Posta</th>
                    <th style={{ padding: '0.8rem 1rem' }}>Kayıt Tarihi</th>
                    <th style={{ padding: '0.8rem 1rem', textAlign: 'center' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>{u.name} {u.surname}</td>
                      <td style={{ padding: '1rem' }}>{u.email}</td>
                      <td style={{ padding: '1rem' }}>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                         <form action={approveUser} style={{ display: 'inline' }}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.8rem' }}>Onayla ve Üye Yap</button>
                         </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
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
                  {approvedUsers.map((u: any) => {
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--primary-gold)' }}>Kapak Fotoğrafı Seçiniz:</label>
                <input 
                  type="file" 
                  name="image" 
                  accept="image/*" 
                  style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} 
                />
              </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--primary-gold)' }}>Oyun Afişi (Poster):</label>
                  <input 
                    type="file" 
                    name="poster" 
                    accept="image/*" 
                    style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} 
                  />
                </div>
                <input 
                  type="text" 
                  name="videoUrl" 
                  placeholder="YouTube Video Linki (Opsiyonel)" 
                  style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Oyunu Portfolyoya Ekle</button>
              </form>
            </div>
          )}
          
        </div>

        {/* İÇERİK YÖNETİMİ (SİLME) ALANI */}
        <div className="glass-card" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem' }}>
          <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>📑 Mevcut İçerikleri Düzenle</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Blog Yönetimi */}
            <div>
              <h3 style={{ color: 'var(--primary-gold)', marginBottom: '1rem', fontSize: '1.1rem' }}>Sistemdeki Blog Yazıları</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {posts.map((p: any) => (
                  <div key={p.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '0.9rem' }}>{p.title}</span>
                    <DeleteButton 
                      action={deletePost} 
                      id={p.id} 
                      name={p.title} 
                      confirmMessage="Bu yazıyı sonsuza dek silmek istediğine emin misin?" 
                      idFieldName="postId"
                    />
                  </div>
                ))}
                {posts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Henüz hiç yazı paylaşılmamış.</p>}
              </div>
            </div>

            {/* Oyun Yönetimi */}
            <div>
              <h3 style={{ color: 'var(--primary-gold)', marginBottom: '1rem', fontSize: '1.1rem' }}>Sistemdeki Oyunlar</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plays.map((p: any) => (
                  <div key={p.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '0.9rem' }}>{p.title} ({p.year})</span>
                    {(role === 'SUPERADMIN' || role === 'ADMIN') ? (
                      <DeleteButton 
                        action={deletePlay} 
                        id={p.id} 
                        name={p.title} 
                        confirmMessage="Bu oyunu sahneden tamamen kaldırmak istediğine emin misin?" 
                        idFieldName="playId"
                      />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yetkiniz Yok</span>
                    )}
                  </div>
                ))}
                {plays.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Henüz hiç oyun eklenmemiş.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div style={{ padding: '10rem 5%', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#ff4d4d' }}>Dashboard Yüklenemedi (Sistem Hatası)</h1>
        <p style={{ marginTop: '1rem', opacity: 0.8 }}>Hata Detayı: {error.message || 'Bilinmeyen Hata'}</p>
        <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', marginTop: '1rem', borderRadius: '8px', textAlign: 'left', display: 'inline-block' }}>
          {error.stack}
        </pre>
      </div>
    );
  }
}
