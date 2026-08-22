import { addPost, addPlay, changeUserRole, deletePost, deletePlay, approveUser, addEvent, deleteEvent, updateSiteConfig } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const role = (session.user as any).role;
    if (role !== 'SUPERADMIN' && role !== 'ADMIN' && role !== 'EDITOR') {
      redirect('/');
    }

    const sp = await searchParams;
    const activeTab = sp.tab || 'overview';

    // Veritabanı verilerini çek
    const [usersSnap, postsSnap, playsSnap, eventsSnap, requestsSnap, configDoc] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('posts').get(),
      adminDb.collection('plays').get(),
      adminDb.collection('events').get(),
      adminDb.collection('eventRequests').get(),
      adminDb.collection('settings').doc('site_config').get(),
    ]);

    const allUsers = usersSnap.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, name: data.name || '', surname: data.surname || '', email: data.email || '', role: data.role || 'MEMBER', createdAt: data.createdAt || new Date().toISOString(), phone: data.phone || '', department: data.department || '' };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const plays = playsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const eventRequests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const siteConfig = configDoc.exists ? configDoc.data() : {};

    const pendingUsers = allUsers.filter(u => u.role === 'PENDING');
    const approvedUsers = allUsers.filter(u => u.role !== 'PENDING');

    // Sidebar yapısı
    const tabs = [
      { key: 'overview', label: 'Genel Bakış', icon: 'grid-outline', roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'] },
      { key: 'members', label: 'Üyeler', icon: 'people-outline', roles: ['SUPERADMIN', 'ADMIN'], badge: pendingUsers.length || undefined },
      { key: 'plays', label: 'Oyunlar', icon: 'film-outline', roles: ['SUPERADMIN', 'ADMIN'] },
      { key: 'blog', label: 'Blog', icon: 'create-outline', roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'] },
      { key: 'events', label: 'Etkinlikler', icon: 'calendar-outline', roles: ['SUPERADMIN', 'ADMIN'] },
      { key: 'tickets', label: 'Bilet Merkezi', icon: 'ticket-outline', roles: ['SUPERADMIN', 'ADMIN'] },
      { key: 'site', label: 'Site Görünümü', icon: 'image-outline', roles: ['SUPERADMIN', 'ADMIN'] },
    ].filter(t => t.roles.includes(role));

    const inputStyle = { padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)', color: '#fff', width: '100%', fontSize: '0.9rem' };
    const labelStyle = { fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '0.4rem', display: 'block' };

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>

        {/* Üst Bar */}
        <div style={{ paddingTop: '5rem', paddingBottom: '1rem', paddingLeft: '5%', paddingRight: '5%', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1380px', margin: '0 auto' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                FSM Tiyatro — Yönetim Paneli
              </span>
              <h1 className="serif-font" style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>
                {tabs.find(t => t.key === activeTab)?.label || 'Genel Bakış'}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {(role === 'SUPERADMIN' || role === 'ADMIN') && (
                <a href="/members/tickets" style={{ padding: '0.6rem 1.2rem', background: 'var(--primary-gold)', color: '#000', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ion-icon name="ticket-outline" /> Bilet Satış Paneli
                </a>
              )}
              <a href="/" style={{ padding: '0.6rem 1.2rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                Siteye Git
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, maxWidth: '1380px', margin: '0 auto', width: '100%', padding: '2rem 5%', gap: '2rem' }}>

          {/* Sol Sidebar */}
          <aside style={{ width: '220px', flexShrink: 0 }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'sticky', top: '6rem' }}>
              {tabs.map(tab => (
                <a
                  key={tab.key}
                  href={`/tanerabi/dashboard?tab=${tab.key}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.7rem 1rem', borderRadius: '10px',
                    fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                    color: activeTab === tab.key ? 'var(--primary-gold)' : 'var(--text-muted)',
                    background: activeTab === tab.key ? 'rgba(200,162,97,0.1)' : 'transparent',
                    border: activeTab === tab.key ? '1px solid rgba(200,162,97,0.2)' : '1px solid transparent',
                    textDecoration: 'none', transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <ion-icon name={tab.icon} style={{ fontSize: '1.1rem' }} />
                  {tab.label}
                  {tab.badge ? (
                    <span style={{ marginLeft: 'auto', background: 'var(--primary-gold)', color: '#000', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 'black', padding: '0.1rem 0.45rem', minWidth: '1.2rem', textAlign: 'center' }}>
                      {tab.badge}
                    </span>
                  ) : null}
                </a>
              ))}
            </nav>
          </aside>

          {/* Sağ İçerik */}
          <main style={{ flex: 1, minWidth: 0 }}>

            {/* --- GENEL BAKIŞ --- */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Toplam Üye', value: approvedUsers.length, icon: 'people' },
                    { label: 'Bekleyen Onay', value: pendingUsers.length, icon: 'time', color: pendingUsers.length > 0 ? 'var(--primary-gold)' : undefined },
                    { label: 'Oyun', value: plays.length, icon: 'film' },
                    { label: 'Blog Yazısı', value: posts.length, icon: 'document-text' },
                    { label: 'Etkinlik', value: events.length, icon: 'calendar' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <ion-icon name={stat.icon} style={{ fontSize: '1.5rem', color: stat.color || 'var(--primary-gold)' }} />
                      <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color || '#fff', lineHeight: 1 }}>{stat.value}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
                    </div>
                  ))}
                </div>

                {pendingUsers.length > 0 && (
                  <div style={{ background: 'rgba(200,162,97,0.07)', border: '1px solid rgba(200,162,97,0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--primary-gold)', fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                      🔔 {pendingUsers.length} yeni üye onay bekliyor
                    </p>
                    <a href="/tanerabi/dashboard?tab=members" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>Üyeler sekmesine git →</a>
                  </div>
                )}

                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>Hızlı Erişim</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {tabs.filter(t => t.key !== 'overview').map(t => (
                      <a key={t.key} href={`/tanerabi/dashboard?tab=${t.key}`} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <ion-icon name={t.icon} /> {t.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- ÜYELER --- */}
            {activeTab === 'members' && (role === 'SUPERADMIN' || role === 'ADMIN') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Onay bekleyenler */}
                {pendingUsers.length > 0 && (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(200,162,97,0.3)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h2 style={{ color: 'var(--primary-gold)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ion-icon name="time-outline" /> Onay Bekleyenler ({pendingUsers.length})
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: '#fff' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {['Ad Soyad', 'E-Posta', 'Kayıt Tarihi', 'İşlem'].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {pendingUsers.map((u: any) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.875rem' }}>{u.name} {u.surname}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-muted)' }}>{u.email}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-dim)' }}>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                              <td style={{ padding: '0.875rem' }}>
                                <form action={approveUser as any} style={{ display: 'inline' }}>
                                  <input type="hidden" name="userId" value={u.id} />
                                  <button type="submit" style={{ padding: '0.35rem 1rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Onayla</button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tüm üyeler */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ion-icon name="people-outline" /> Üye & Personel Listesi ({approvedUsers.length})
                  </h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: '#fff' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {['Ad Soyad', 'Rol', 'E-Posta', 'Telefon', 'Bölüm', ''].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {approvedUsers.map((u: any) => {
                          const canEdit = (role === 'SUPERADMIN') || (role === 'ADMIN' && u.role !== 'SUPERADMIN' && u.role !== 'ADMIN');
                          const roleColor = u.role === 'SUPERADMIN' ? '#f87171' : u.role === 'ADMIN' ? 'var(--primary-gold)' : u.role === 'SALES' ? '#4ade80' : 'var(--text-muted)';
                          const roleLabel: Record<string, string> = { SUPERADMIN: 'Süper Admin', ADMIN: 'Admin', SALES: 'Satış', EDITOR: 'Editör', DIRECTOR: 'Yönetmen', ASST_DIRECTOR: 'Yrd. Yönetmen', AKTOR: 'Aktör', MEMBER: 'Üye' };
                          return (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.875rem', fontWeight: '500' }}>{u.name} {u.surname}</td>
                              <td style={{ padding: '0.875rem' }}>
                                {canEdit ? (
                                  <form action={changeUserRole as any} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <input type="hidden" name="userId" value={u.id} />
                                    <select name="newRole" defaultValue={u.role} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: roleColor, border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>
                                      {role === 'SUPERADMIN' && <option value="SUPERADMIN">Süper Admin</option>}
                                      {role === 'SUPERADMIN' && <option value="ADMIN">Admin</option>}
                                      <option value="SALES">Satış</option>
                                      <option value="EDITOR">Editör</option>
                                      <option value="DIRECTOR">Yönetmen</option>
                                      <option value="ASST_DIRECTOR">Yrd. Yönetmen</option>
                                      <option value="AKTOR">Aktör</option>
                                      <option value="MEMBER">Üye</option>
                                    </select>
                                    <button type="submit" style={{ padding: '0.3rem 0.6rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>Kaydet</button>
                                  </form>
                                ) : (
                                  <span style={{ color: roleColor, fontWeight: 'bold', fontSize: '0.8rem' }}>{roleLabel[u.role] || u.role}</span>
                                )}
                              </td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>{u.phone || '—'}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--primary-gold)', fontSize: '0.8rem' }}>{u.department || '—'}</td>
                              <td style={{ padding: '0.875rem' }}>
                                <a href={`/tanerabi/users/${u.id}`} style={{ padding: '0.3rem 0.7rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>İncele</a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Etkinlik katılım talepleri */}
                {eventRequests.length > 0 && (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ion-icon name="notifications-outline" style={{ color: 'var(--primary-gold)' }} /> Etkinlik Katılım Talepleri
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: '#fff' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {['Üye', 'Etkinlik', 'Tarih', 'Durum'].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {eventRequests.map((req: any) => (
                            <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '0.875rem' }}>
                                <div style={{ fontWeight: '500' }}>{req.userName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{req.userEmail}</div>
                              </td>
                              <td style={{ padding: '0.875rem', color: 'var(--primary-gold)' }}>{req.eventTitle}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>{new Date(req.createdAt).toLocaleDateString('tr-TR')}</td>
                              <td style={{ padding: '0.875rem' }}>
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(200,162,97,0.1)', color: 'var(--primary-gold)', border: '1px solid rgba(200,162,97,0.2)', fontWeight: 'bold' }}>YENİ</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- OYUNLAR --- */}
            {activeTab === 'plays' && (role === 'SUPERADMIN' || role === 'ADMIN') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Yeni Oyun Ekle</h2>
                  <form action={addPlay as any} encType="multipart/form-data" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Oyun Adı</label>
                      <input type="text" name="title" placeholder="Örn: Hamlet" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Sezon</label>
                      <input type="text" name="year" placeholder="Örn: 2026 Sezonu" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Oyun Afişi (maks. 2MB)</label>
                      <input type="file" name="poster" accept="image/jpeg,image/png,image/webp" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Özet</label>
                      <textarea name="description" placeholder="Oyun özeti..." rows={3} style={inputStyle} required />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>YouTube Linki (isteğe bağlı)</label>
                      <input type="text" name="videoUrl" placeholder="https://youtube.com/..." style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <button type="submit" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer' }}>Oyunu Ekle</button>
                    </div>
                  </form>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Mevcut Oyunlar ({plays.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {plays.map((p: any) => (
                      <div key={p.id} style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '500' }}>{p.title}</span>
                          {p.year && <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{p.year}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                          <a href={`/plays/${p.id}`} target="_blank" style={{ padding: '0.3rem 0.7rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Görüntüle</a>
                          <DeleteButton action={deletePlay as any} id={p.id} name={p.title} confirmMessage="Bu oyunu silmek istediğine emin misin?" idFieldName="playId" />
                        </div>
                      </div>
                    ))}
                    {plays.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Henüz oyun eklenmemiş.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- BLOG --- */}
            {activeTab === 'blog' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Yeni Blog Yazısı Ekle</h2>
                  <form action={addPost as any} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Yazı Başlığı</label>
                      <input type="text" name="title" placeholder="Başlık" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>İçerik</label>
                      <textarea name="content" placeholder="Yazının içeriği..." rows={6} style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Kapak Fotoğrafı (maks. 2MB)</label>
                      <input type="file" name="image" accept="image/jpeg,image/png,image/webp" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                    </div>
                    <button type="submit" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer', alignSelf: 'flex-start' }}>Yayınla</button>
                  </form>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Mevcut Yazılar ({posts.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {posts.map((p: any) => (
                      <div key={p.id} style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '500' }}>{p.title}</span>
                          {p.createdAt && <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{new Date(p.createdAt).toLocaleDateString('tr-TR')}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                          <a href={`/blog/${p.id}`} target="_blank" style={{ padding: '0.3rem 0.7rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Görüntüle</a>
                          <DeleteButton action={deletePost as any} id={p.id} name={p.title} confirmMessage="Bu yazıyı silmek istediğine emin misin?" idFieldName="postId" />
                        </div>
                      </div>
                    ))}
                    {posts.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Henüz yazı paylaşılmamış.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- ETKİNLİKLER --- */}
            {activeTab === 'events' && (role === 'SUPERADMIN' || role === 'ADMIN') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Yeni Etkinlik Ekle</h2>
                  <form action={addEvent as any} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Etkinlik Başlığı</label>
                      <input type="text" name="title" placeholder="Etkinlik adı" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Tarih & Saat</label>
                      <input type="text" name="date" placeholder="Örn: 15 Mart 2026, 18:00" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Yer / Platform</label>
                      <input type="text" name="location" placeholder="Mekan veya online link" style={inputStyle} required />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Açıklama (isteğe bağlı)</label>
                      <textarea name="description" placeholder="Kısa açıklama..." rows={2} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <button type="submit" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer' }}>Etkinliği Ekle</button>
                    </div>
                  </form>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Mevcut Etkinlikler ({events.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {events.map((e: any) => (
                      <div key={e.id} style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '500' }}>{e.title}</span>
                          {e.date && <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{e.date}</span>}
                        </div>
                        <DeleteButton action={deleteEvent as any} id={e.id} name={e.title} confirmMessage="Bu etkinliği silmek istiyor musun?" idFieldName="eventId" />
                      </div>
                    ))}
                    {events.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Henüz etkinlik eklenmemiş.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- BİLET MERKEZİ --- */}
            {activeTab === 'tickets' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                <ion-icon name="ticket-outline" style={{ fontSize: '3rem', color: 'var(--primary-gold)', display: 'block', margin: '0 auto 1rem' }} />
                <h2 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Bilet Satış ve Kontrol Paneli</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Bilet satışı, koltuk haritası ve bilet taraması için ayrı paneli kullanın.</p>
                <a href="/members/tickets" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block' }}>
                  Bilet Paneline Git →
                </a>
              </div>
            )}

            {/* --- SİTE GÖRÜNÜMÜ --- */}
            {activeTab === 'site' && (role === 'SUPERADMIN' || role === 'ADMIN') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Site Yapılandırması</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Ana sayfa hero görseli, pinli slaytlar ve iletişim bilgilerini buradan güncelleyin. Değişiklikler anında canlıya yansır.</p>

                  <form action={updateSiteConfig as any} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={labelStyle}>Hero Arka Plan Görseli URL</label>
                      <input type="url" name="heroImageUrl" defaultValue={siteConfig?.heroImageUrl || ''} placeholder="https://firebasestorage.googleapis.com/..." style={inputStyle} />
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                        Firebase Storage Console'dan görseli yükleyip linki buraya yapıştırın. Oyunlara ve blog yazılarına görsel eklenirse onlar öncelikli gösterilir.
                      </p>
                    </div>

                    <div>
                      <label style={labelStyle}>İletişim / Sponsorluk E-Postası</label>
                      <input type="email" name="contactEmail" defaultValue={siteConfig?.contactEmail || 'tiyatro@fsm.edu.tr'} placeholder="tiyatro@fsm.edu.tr" style={inputStyle} />
                    </div>

                    <button type="submit" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer', alignSelf: 'flex-start' }}>
                      Kaydet ve Yayınla
                    </button>
                  </form>
                </div>

                {/* Pinlenmiş slaytlar */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Öne Çıkan Slaytlar</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                    Seçtiğiniz oyun veya blog yazısı ana sayfadaki carousel'de ilk sırada gösterilir. Pinlenmeyen içerikler en yeni olanlardan otomatik seçilir.
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Oyunlar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {plays.map((p: any) => {
                        const isPinned = (siteConfig?.pinnedSlides || []).includes(p.id);
                        return (
                          <div key={p.id} style={{ padding: '0.65rem 1rem', background: isPinned ? 'rgba(200,162,97,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', border: isPinned ? '1px solid rgba(200,162,97,0.25)' : '1px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: isPinned ? 'var(--primary-gold)' : '#fff', fontSize: '0.875rem' }}>
                              {isPinned && '📌 '}{p.title}
                            </span>
                            <form action={updateSiteConfig as any}>
                              <input type="hidden" name="pinnedSlides" value={JSON.stringify(
                                isPinned
                                  ? (siteConfig?.pinnedSlides || []).filter((id: string) => id !== p.id)
                                  : [...(siteConfig?.pinnedSlides || []), p.id]
                              )} />
                              <button type="submit" style={{ padding: '0.3rem 0.75rem', border: `1px solid ${isPinned ? 'rgba(200,162,97,0.4)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', background: 'transparent', color: isPinned ? 'var(--primary-gold)' : 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}>
                                {isPinned ? 'Kaldır' : 'Öne Çıkar'}
                              </button>
                            </form>
                          </div>
                        );
                      })}
                      {plays.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Henüz oyun yok.</p>}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Blog Yazıları</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {posts.slice(0, 8).map((p: any) => {
                        const isPinned = (siteConfig?.pinnedSlides || []).includes(p.id);
                        return (
                          <div key={p.id} style={{ padding: '0.65rem 1rem', background: isPinned ? 'rgba(200,162,97,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', border: isPinned ? '1px solid rgba(200,162,97,0.25)' : '1px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: isPinned ? 'var(--primary-gold)' : '#fff', fontSize: '0.875rem' }}>
                              {isPinned && '📌 '}{p.title}
                            </span>
                            <form action={updateSiteConfig as any}>
                              <input type="hidden" name="pinnedSlides" value={JSON.stringify(
                                isPinned
                                  ? (siteConfig?.pinnedSlides || []).filter((id: string) => id !== p.id)
                                  : [...(siteConfig?.pinnedSlides || []), p.id]
                              )} />
                              <button type="submit" style={{ padding: '0.3rem 0.75rem', border: `1px solid ${isPinned ? 'rgba(200,162,97,0.4)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', background: 'transparent', color: isPinned ? 'var(--primary-gold)' : 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}>
                                {isPinned ? 'Kaldır' : 'Öne Çıkar'}
                              </button>
                            </form>
                          </div>
                        );
                      })}
                      {posts.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Henüz yazı yok.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div style={{ padding: '10rem 5%', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#f87171' }}>Panel Yüklenemedi</h1>
        <p style={{ marginTop: '1rem', opacity: 0.8 }}>Sistemde geçici bir sorun oluştu. Lütfen daha sonra tekrar deneyin.</p>
        <div style={{ marginTop: '2rem' }}>
          <a href="/" className="btn btn-outline">Ana Sayfaya Dön</a>
        </div>
      </div>
    );
  }
}
