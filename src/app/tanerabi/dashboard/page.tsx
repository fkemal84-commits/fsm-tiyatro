import { addPost, addPlay, changeUserRole, deletePost, deletePlay, approveUser, rejectUser, deleteUserRecord, addEvent, deleteEvent, updateSiteConfig, addAvailableTitle, removeAvailableTitle, addTeamNeed, deleteTeamNeed, deleteTeamApplication } from '@/app/actions';
import DeleteButton from '@/components/DeleteButton';
import SiteConfigForm from '@/components/SiteConfigForm';
import RoleSelector from '@/components/RoleSelector';
import TitleManager from '@/components/TitleManager';
import TitlePoolManager from '@/components/TitlePoolManager';
import PlayCastEditor from '@/components/PlayCastEditor';
import SmartFileInput from '@/components/SmartFileInput';
import PlayStatusChanger from '@/components/PlayStatusChanger';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ tab?: string; year?: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const role = (session.user as any).role;
    if (role !== 'SUPERADMIN' && role !== 'ADMIN' && role !== 'EDITOR') {
      redirect('/');
    }

    const sp = await searchParams;
    const activeTab = sp.tab || 'overview';
    const selectedYear = sp.year || 'all';

    // Veritabanı verilerini çek
    const [usersSnap, postsSnap, playsSnap, eventsSnap, requestsSnap, configDoc, titlesDoc, teamNeedsSnap, teamAppsSnap, eventReservationsSnap] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('posts').get(),
      adminDb.collection('plays').get(),
      adminDb.collection('events').get(),
      adminDb.collection('eventRequests').get(),
      adminDb.collection('settings').doc('site_config').get(),
      adminDb.collection('settings').doc('titles').get(),
      adminDb.collection('teamNeeds').get(),
      adminDb.collection('teamApplications').get(),
      adminDb.collection('eventReservations').get(),
    ]);

    const defaultTitles = [
      'Kulüp Başkanı', 'Başkan Yardımcısı', 'Sayman', 'Genel Sekreter', 
      'Yönetim Kurulu Üyesi', 'Denetim Kurulu Üyesi', 'Dekor & Sahne Amiri',
      'Kostüm & Aksesuar', 'Işık & Ses', 'Sosyal Medya & Tasarım', 'Dramaturg'
    ];

    const availableTitles: string[] = titlesDoc.exists && Array.isArray(titlesDoc.data()?.list)
      ? titlesDoc.data()!.list
      : defaultTitles;

    const allUsers = usersSnap.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt || new Date().toISOString();
      
      // Üniversite tiyatro takvimi sezon hesabı:
      // Temmuz ve sonrasındaki kayıtlar başlayan yeni sezonundur (Örn: 2026 Ağustos/Ekim -> 2026-2027 Sezonu / 2027 Kayıtları)
      let userSeason = data.season || '';
      let userSeasonYear = data.registrationYear || '';
      let academicYear = data.academicYear || '';

      if (createdAt) {
        try {
          const cd = new Date(createdAt);
          const cYear = cd.getFullYear();
          const cMonth = cd.getMonth() + 1;
          const sStart = cMonth >= 7 ? cYear : cYear - 1;
          const sTarget = (sStart + 1).toString();
          
          if (!userSeason) userSeason = `${sStart}-${sStart + 1} Sezonu`;
          if (!userSeasonYear) userSeasonYear = sTarget; // "2027"
          if (!academicYear) academicYear = `${sStart}-${sStart + 1}`;
        } catch {
          if (!userSeason) userSeason = '2026-2027 Sezonu';
          if (!userSeasonYear) userSeasonYear = '2027';
          if (!academicYear) academicYear = '2026-2027';
        }
      }

      let rawDigits = (data.rawPhone || data.phone || '').replace(/\D/g, '');
      if (rawDigits.startsWith('90') && rawDigits.length === 12) {
        rawDigits = rawDigits.slice(2);
      } else if (rawDigits.startsWith('0') && rawDigits.length === 11) {
        rawDigits = rawDigits.slice(1);
      }

      const whatsappNumber = rawDigits.length === 10 ? `+90${rawDigits}` : (data.phone || '');
      const formattedDisplayPhone = rawDigits.length === 10 
        ? `0${rawDigits.slice(0, 3)} ${rawDigits.slice(3, 6)} ${rawDigits.slice(6, 8)} ${rawDigits.slice(8, 10)}`
        : (data.phone || '');
      const whatsappLink = rawDigits.length === 10 ? `https://wa.me/90${rawDigits}` : '';

      return { 
        id: doc.id, 
        name: data.name || '', 
        surname: data.surname || '', 
        email: data.email || '', 
        role: data.role || 'MEMBER', 
        titles: Array.isArray(data.titles) ? data.titles : [],
        createdAt, 
        phone: whatsappNumber, 
        formattedPhone: formattedDisplayPhone,
        whatsappLink,
        department: data.department || '',
        registrationYear: userSeasonYear, // "2027"
        season: userSeason,               // "2026-2027 Sezonu"
        academicYear,                     // "2026-2027"
        seasonTag: `${userSeason} (${userSeasonYear})` // "2026-2027 Sezonu (2027)"
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const plays = playsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const eventRequests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() as any })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const eventReservations = eventReservationsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const siteConfig = configDoc.exists ? configDoc.data() : {};

    const pendingUsers = allUsers.filter(u => u.role === 'PENDING');
    const approvedUsers = allUsers.filter(u => u.role !== 'PENDING');

    // Mevcut kayıt sezonları listesi (Sezon adına göre grupla)
    const availableSeasons = Array.from(
      new Map(
        approvedUsers.map(u => [
          u.registrationYear, 
          { 
            key: u.registrationYear, 
            season: u.season, 
            label: `${u.season} (${u.registrationYear} Kayıtları)` 
          }
        ])
      ).values()
    ).sort((a, b) => Number(b.key) - Number(a.key));

    const displayApprovedUsers = selectedYear !== 'all' 
      ? approvedUsers.filter(u => u.registrationYear === selectedYear || u.season === selectedYear)
      : approvedUsers;

    const teamNeeds = teamNeedsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const teamApplications = teamAppsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Sidebar yapısı
    const tabs = [
      { key: 'overview', label: 'Genel Bakış', icon: 'grid-outline', roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'] },
      { key: 'members', label: 'Üyeler', icon: 'people-outline', roles: ['SUPERADMIN', 'ADMIN'], badge: pendingUsers.length || undefined },
      { key: 'needs', label: 'İş & Görev İlanları', icon: 'briefcase-outline', roles: ['SUPERADMIN', 'ADMIN'], badge: teamApplications.length || undefined },
      { key: 'plays', label: 'Oyunlar', icon: 'film-outline', roles: ['SUPERADMIN', 'ADMIN'] },
      { key: 'blog', label: 'Blog', icon: 'create-outline', roles: ['SUPERADMIN', 'ADMIN', 'EDITOR'] },
      { key: 'events', label: 'Etkinlikler', icon: 'calendar-outline', roles: ['SUPERADMIN', 'ADMIN'] },
      { key: 'tickets', label: 'Bilet Merkezi', icon: 'ticket-outline', roles: ['SUPERADMIN', 'ADMIN'] },
      { key: 'site', label: 'Site Görünümü', icon: 'image-outline', roles: ['SUPERADMIN', 'ADMIN'] },
    ].filter(t => t.roles.includes(role));

    const inputStyle = { padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-main)', width: '100%', fontSize: '0.9rem' };
    const labelStyle = { fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '0.4rem', display: 'block' };

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>

        {/* Üst Bar */}
        <div style={{ paddingTop: '7.5rem', paddingBottom: '1.5rem', paddingLeft: '5%', paddingRight: '5%', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
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
                <Link href="/members/tickets" style={{ padding: '0.6rem 1.2rem', background: 'var(--primary-gold)', color: '#000', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ion-icon name="ticket-outline" /> Bilet Satış Paneli
                </Link>
              )}
              <Link href="/" style={{ padding: '0.6rem 1.2rem', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                Siteye Git
              </Link>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, maxWidth: '1380px', margin: '0 auto', width: '100%', padding: '2rem 5%', gap: '2rem' }}>

          {/* Sol Sidebar */}
          <aside style={{ width: '220px', flexShrink: 0 }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'sticky', top: '8rem' }}>
              {tabs.map(tab => (
                <Link
                  key={tab.key}
                  href={`/tanerabi/dashboard?tab=${tab.key}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', borderRadius: '10px',
                    fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 'bold' : '500',
                    color: activeTab === tab.key ? 'var(--primary-gold)' : 'var(--text-muted)',
                    background: activeTab === tab.key ? 'var(--primary-gold-dim)' : 'transparent',
                    border: activeTab === tab.key ? '1px solid var(--primary-gold-border)' : '1px solid transparent',
                    textDecoration: 'none', transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <ion-icon name={tab.icon} style={{ fontSize: '1.15rem' }} />
                  {tab.label}
                  {tab.badge ? (
                    <span style={{ marginLeft: 'auto', background: 'var(--primary-gold)', color: '#000', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 'bold', padding: '0.1rem 0.45rem', minWidth: '1.2rem', textAlign: 'center' }}>
                      {tab.badge}
                    </span>
                  ) : null}
                </Link>
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
                    <div key={stat.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <ion-icon name={stat.icon} style={{ fontSize: '1.5rem', color: stat.color || 'var(--primary-gold)' }} />
                      <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color || 'var(--text-main)', lineHeight: 1 }}>{stat.value}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
                    </div>
                  ))}
                </div>

                {pendingUsers.length > 0 && (
                  <div style={{ background: 'var(--primary-gold-dim)', border: '1px solid var(--primary-gold-border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--primary-gold)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      🔔 {pendingUsers.length} yeni üye onay bekliyor
                    </p>
                    <Link href="/tanerabi/dashboard?tab=members" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>Üyeler sekmesine git →</Link>
                  </div>
                )}

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1rem', fontWeight: 'bold' }}>Hızlı Erişim</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {tabs.filter(t => t.key !== 'overview').map(t => (
                      <Link key={t.key} href={`/tanerabi/dashboard?tab=${t.key}`} style={{ padding: '0.6rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                        <ion-icon name={t.icon} /> {t.label}
                      </Link>
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
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary-gold-border)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h2 style={{ color: 'var(--primary-gold)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ion-icon name="time-outline" /> Onay Bekleyenler ({pendingUsers.length})
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                            {['Ad Soyad', 'E-Posta', 'Kayıt Tarihi', 'İşlem'].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {pendingUsers.map((u: any) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '0.875rem', color: 'var(--text-main)', fontWeight: '500' }}>{u.name} {u.surname}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-muted)' }}>{u.email}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-dim)' }}>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                              <td style={{ padding: '0.875rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <form action={approveUser as any} style={{ display: 'inline' }}>
                                    <input type="hidden" name="userId" value={u.id} />
                                    <button type="submit" style={{ padding: '0.4rem 1.1rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Onayla</button>
                                  </form>
                                  <form action={rejectUser as any} style={{ display: 'inline' }}>
                                    <input type="hidden" name="userId" value={u.id} />
                                    <button type="submit" style={{ padding: '0.4rem 1.1rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Reddet</button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Kulüp Görev & Unvan Havuzu Yönetimi */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h2 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <ion-icon name="ribbon-outline" style={{ color: 'var(--primary-gold)' }} /> Kulüp Görev & Unvan Havuzu
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                        Kulüp içi görev ve unvanları buradan tanımlayabilir, aşağıdaki üyelerinize birden fazla görev atayabilirsiniz.
                      </p>
                    </div>
                  </div>

                  {/* Unvan Havuzu Yönetim Bileşeni (Ekleme ve Silme) */}
                  <TitlePoolManager initialTitles={availableTitles} />
                </div>

                {/* Tüm üyeler */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <ion-icon name="people-outline" /> Üye & Personel Listesi ({displayApprovedUsers.length})
                      </h2>
                      {selectedYear !== 'all' && (
                        <p style={{ color: 'var(--primary-gold)', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>
                          Filtrelenen Dönem: <strong>{selectedYear} Kayıtları</strong> ({displayApprovedUsers.length} kişi)
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a 
                        href={`/api/admin/export-users?year=${selectedYear}&format=csv`} 
                        download 
                        style={{ 
                          padding: '0.5rem 1rem', 
                          background: 'var(--bg-surface-elevated)', 
                          border: '1px solid var(--border-medium)', 
                          borderRadius: '8px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          color: 'var(--primary-gold)', 
                          textDecoration: 'none', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.4rem' 
                        }}
                      >
                        <ion-icon name="download-outline" /> CSV İndir {selectedYear !== 'all' ? `(${selectedYear})` : '(Tümü)'}
                      </a>
                      <a 
                        href={`/api/admin/export-users?year=${selectedYear}&format=vcf`} 
                        download 
                        title="Tüm stand kayıtlarını doğrudan telefon rehberinize aktarmak için vCard dosyası indirin"
                        style={{ 
                          padding: '0.5rem 1rem', 
                          background: 'rgba(16, 185, 129, 0.12)', 
                          border: '1px solid rgba(16, 185, 129, 0.3)', 
                          borderRadius: '8px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          color: '#10b981', 
                          textDecoration: 'none', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.4rem' 
                        }}
                      >
                        <ion-icon name="person-add-outline" /> 📇 Rehbere Aktar (.vcf)
                      </a>
                    </div>
                  </div>

                  {/* Sezon Filtre Butonları */}
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '0.4rem' }}>
                      Sezon:
                    </span>
                    <Link
                      href="/tanerabi/dashboard?tab=members&year=all"
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: selectedYear === 'all' ? 'bold' : 'normal',
                        background: selectedYear === 'all' ? 'var(--primary-gold)' : 'var(--bg-surface-elevated)',
                        color: selectedYear === 'all' ? '#000' : 'var(--text-muted)',
                        border: selectedYear === 'all' ? '1px solid var(--primary-gold)' : '1px solid var(--border-subtle)',
                        textDecoration: 'none'
                      }}
                    >
                      Tüm Sezonlar ({approvedUsers.length})
                    </Link>
                    {availableSeasons.map(s => {
                      const count = approvedUsers.filter(u => u.registrationYear === s.key || u.season === s.season).length;
                      const isSelected = selectedYear === s.key || selectedYear === s.season;
                      return (
                        <Link
                          key={s.key}
                          href={`/tanerabi/dashboard?tab=members&year=${s.key}`}
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            background: isSelected ? 'var(--primary-gold)' : 'var(--bg-surface-elevated)',
                            color: isSelected ? '#000' : 'var(--text-muted)',
                            border: isSelected ? '1px solid var(--primary-gold)' : '1px solid var(--border-subtle)',
                            textDecoration: 'none'
                          }}
                        >
                          🎭 {s.season} ({count})
                        </Link>
                      );
                    })}
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                          {['Ad Soyad', 'Sistem Yetkisi', 'Kulüp Görevleri', 'Telefon & WhatsApp', 'Bölüm & Sezon', 'E-Posta', '', ''].map((h, i) => (
                            <th key={`${h}-${i}`} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayApprovedUsers.map((u: any) => {
                          const canEdit = (role === 'SUPERADMIN') || (role === 'ADMIN' && u.role !== 'SUPERADMIN' && u.role !== 'ADMIN');
                          const roleLabel: Record<string, string> = { SUPERADMIN: 'Süper Admin', ADMIN: 'Admin', SALES: 'Satış', EDITOR: 'Editör', DIRECTOR: 'Yönetmen', ASST_DIRECTOR: 'Yrd. Yönetmen', AKTOR: 'Aktör', MEMBER: 'Üye' };
                          return (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '0.875rem', fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                {u.name} {u.surname}
                              </td>
                              <td style={{ padding: '0.875rem' }}>
                                {canEdit ? (
                                  <RoleSelector userId={u.id} currentRole={u.role} currentUserRole={role} />
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    {roleLabel[u.role] || u.role}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.875rem' }}>
                                <TitleManager 
                                  userId={u.id} 
                                  userTitles={u.titles || []} 
                                  availableTitles={availableTitles} 
                                  canEdit={canEdit} 
                                />
                              </td>
                              <td style={{ padding: '0.875rem', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>
                                    {u.formattedPhone || u.phone || '—'}
                                  </span>
                                  {u.whatsappLink && (
                                    <a
                                      href={u.whatsappLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: '#10b981',
                                        fontSize: '0.72rem',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                    >
                                      <ion-icon name="logo-whatsapp" /> WhatsApp Aç →
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '0.875rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <span style={{ color: 'var(--primary-gold)', fontSize: '0.8rem', fontWeight: '500' }}>
                                    {u.department || 'Bölüm Belirtilmedi'}
                                  </span>
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                                    🎭 {u.season || `${u.registrationYear} Sezonu`}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                              <td style={{ padding: '0.875rem' }}>
                                <Link href={`/tanerabi/users/${u.id}`} style={{ padding: '0.35rem 0.75rem', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>İncele</Link>
                              </td>
                              <td style={{ padding: '0.875rem' }}>
                                {canEdit && (
                                  <DeleteButton action={deleteUserRecord as any} id={u.id} name={`${u.name} ${u.surname}`} confirmMessage="Bu üyeyi kalıcı olarak silmek istediğine emin misin?" idFieldName="userId" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {displayApprovedUsers.length === 0 && (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        Bu sezona ait kayıtlı üye bulunamadı.
                      </div>
                    )}
                  </div>
                </div>

                {/* Etkinlik katılım talepleri */}
                {eventRequests.length > 0 && (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ion-icon name="notifications-outline" style={{ color: 'var(--primary-gold)' }} /> Etkinlik Katılım Talepleri
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                            {['Üye', 'Etkinlik', 'Tarih', 'Durum'].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {eventRequests.map((req: any) => (
                            <tr key={req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '0.875rem' }}>
                                <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{req.userName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{req.userEmail}</div>
                              </td>
                              <td style={{ padding: '0.875rem', color: 'var(--primary-gold)' }}>{req.eventTitle}</td>
                              <td style={{ padding: '0.875rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>{new Date(req.createdAt).toLocaleDateString('tr-TR')}</td>
                              <td style={{ padding: '0.875rem' }}>
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', background: 'var(--primary-gold-dim)', color: 'var(--primary-gold)', border: '1px solid var(--primary-gold-border)', fontWeight: 'bold' }}>YENİ</span>
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
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Yeni Oyun Ekle</h2>
                  <form action={addPlay as any} encType="multipart/form-data" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Oyun Adı</label>
                      <input type="text" name="title" placeholder="Örn: Hamlet" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Oyun Durumu</label>
                      <select name="status" style={inputStyle} defaultValue="ACTIVE">
                        <option value="ACTIVE">🎭 Sahnede (Bu Sezon)</option>
                        <option value="UPCOMING">✨ Yakında (Hazırlanıyor)</option>
                        <option value="ARCHIVED">🏛️ Geçmiş Oyun (Arşiv)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Sezon</label>
                      <input type="text" name="year" placeholder="Örn: 2026-2027 Sezonu" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Yazar / Oyun Yazarı</label>
                      <input type="text" name="playwright" placeholder="Örn: William Shakespeare" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Yönetmen / Reji</label>
                      <input type="text" name="director" placeholder="Örn: Kulüp Yönetmeni" style={inputStyle} />
                    </div>
                    <div>
                      <SmartFileInput
                        name="poster"
                        label="Dikey Oyun Afişi"
                        maxWidth={1200}
                        maxHeight={1800}
                        quality={0.82}
                        helperText="Dikey tiyatro afişinizi seçin; otomatik optimize edilir."
                      />
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
                      <PlayCastEditor />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <button type="submit" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer' }}>Oyunu Ekle</button>
                    </div>
                  </form>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Mevcut Oyunlar ({plays.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {plays.map((p: any) => (
                      <div key={p.id} style={{ padding: '0.875rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 'bold' }}>{p.title}</span>
                          {p.year && <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{p.year}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                          <PlayStatusChanger playId={p.id} initialStatus={p.status || 'ACTIVE'} />
                          <Link href={`/oyunlar/${p.id}`} target="_blank" style={{ padding: '0.35rem 0.75rem', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Görüntüle</Link>
                          <DeleteButton action={deletePlay as any} id={p.id} name={p.title} confirmMessage="Bu oyunu silmek istediğine emin misin?" idFieldName="playId" />
                        </div>
                      </div>
                    ))}
                    {plays.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Henüz oyun eklenmemiş.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- KULİS & YAZILAR --- */}
            {activeTab === 'blog' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Yeni Kulis / Blog Yazısı Ekle</h2>
                  <form action={addPost as any} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Yazı Başlığı</label>
                        <input type="text" name="title" placeholder="Başlık" style={inputStyle} required />
                      </div>
                      <div>
                        <label style={labelStyle}>Kategori</label>
                        <select name="category" style={inputStyle} defaultValue="Kulis">
                          <option value="Kulis">Kulis (Kulüp / Ekip İçi)</option>
                          <option value="Blog">Blog (Tiyatro & Sanat Güncesi)</option>
                          <option value="Makale">Makale (Akademik & Google Scholar)</option>
                          <option value="Haber">Haber (Kulüp Duyurusu)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Kısa Özet (Excerpt / Abstract)</label>
                      <input type="text" name="excerpt" placeholder="Arama motorları ve listeler için 1-2 cümlelik özet" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>İçerik Metni</label>
                      <textarea name="content" placeholder="Yazının tam içeriği..." rows={7} style={inputStyle} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <SmartFileInput
                          name="image"
                          label="Kapak Fotoğrafı"
                          maxWidth={1600}
                          maxHeight={900}
                          quality={0.80}
                          helperText="Boyut sınırı yoktur; anında optimize edilir."
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Ek PDF Belgesi (Akademik / Makale için)</label>
                        <input type="file" name="pdf" accept="application/pdf" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Anahtar Kelimeler (Virgülle ayırın - Google Scholar)</label>
                      <input type="text" name="keywords" placeholder="Örn: tiyatro, dramaturgi, sahne sanatları, hamlet" style={inputStyle} />
                    </div>
                    <button type="submit" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer', alignSelf: 'flex-start' }}>Yazıyı Yayınla</button>
                  </form>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Mevcut Yazılar ({posts.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {posts.map((p: any) => (
                      <div key={p.id} style={{ padding: '0.875rem 1rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
                        <div>
                          <span style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '500' }}>{p.title}</span>
                          {p.createdAt && <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{new Date(p.createdAt).toLocaleDateString('tr-TR')}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                          <Link href={`/kulis/${p.id}`} target="_blank" style={{ padding: '0.35rem 0.75rem', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Görüntüle</Link>
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
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Yeni Etkinlik & Biletli Buluşma Ekle</h2>
                  <form action={addEvent as any} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Etkinlik Başlığı</label>
                      <input type="text" name="title" placeholder="Örn: Devlet Tiyatroları Toplu Oyun Gezisi" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Tarih & Saat</label>
                      <input type="text" name="date" placeholder="Örn: 15 Mart 2026, 18:00" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Yer / Mekan</label>
                      <input type="text" name="location" placeholder="Örn: AKM Büyük Salon veya Haliç Yerleşkesi" style={inputStyle} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Etkinlik Türü</label>
                      <select name="type" style={inputStyle} defaultValue="Tiyatro Bileti">
                        <option value="Tiyatro Bileti">🎭 Tiyatro Bileti / Gezisi</option>
                        <option value="Sinema Bileti">🎬 Sinema Bileti</option>
                        <option value="Özel Atölye">🎨 Özel Atölye</option>
                        <option value="Söyleşi">🎤 Söyleşi & Panel</option>
                        <option value="Kulüp Buluşması">☕ Kulüp Buluşması</option>
                        <option value="Etkinlik">📌 Genel Etkinlik</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <label style={labelStyle}>Bilet & Kontenjan Ayarı</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                        <input type="checkbox" name="isTicketed" value="true" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--primary-gold)' }} />
                        <span style={{ fontWeight: '600' }}>🎟️ Biletli Etkinlik (Sadece Üyeler Ayırtabilir)</span>
                      </label>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Maksimum Kontenjan / Bilet Sayısı (0 = Sınırsız)</label>
                      <input type="number" name="ticketQuota" placeholder="Örn: 20" defaultValue="20" min="0" style={inputStyle} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                        Belirtilen sayıya ulaşıldığında sistem otomatik olarak bilet ayırtmayı kapatacaktır.
                      </span>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={labelStyle}>Açıklama (İsteğe bağlı)</label>
                      <textarea name="description" placeholder="Bilet detayları, buluşma noktası veya notlar..." rows={2} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <button type="submit" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer' }}>Etkinliği Yayınla</button>
                    </div>
                  </form>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Mevcut Etkinlikler & Katılımcı Listeleri ({events.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {events.map((e: any) => {
                      const reservations = eventReservations.filter((r: any) => r.eventId === e.id && r.status === 'ACTIVE');
                      return (
                        <div key={e.id} style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                <span style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 'bold' }}>{e.title}</span>
                                {e.isTicketed && (
                                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                    🎟️ Biletli: {reservations.length} / {e.ticketQuota || '∞'} Bilet
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                <span>📅 {e.date}</span>
                                <span>📍 {e.location || 'Haliç Yerleşkesi'}</span>
                              </div>
                            </div>
                            <DeleteButton action={deleteEvent as any} id={e.id} name={e.title} confirmMessage="Bu etkinliği ve bilet rezervasyonlarını silmek istiyor musunuz?" idFieldName="eventId" />
                          </div>

                          {/* Bilet Alan Üyeler Listesi */}
                          {e.isTicketed && (
                            <details style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                              <summary style={{ cursor: 'pointer', color: 'var(--primary-gold)', fontWeight: 'bold', userSelect: 'none' }}>
                                👥 Bilet Alan Kulüp Üyelerini Gör ({reservations.length} Kişi)
                              </summary>
                              <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {reservations.map((r: any) => (
                                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                                    <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{r.userName} ({r.userEmail})</span>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--primary-gold)', fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                      {r.ticketCode}
                                    </span>
                                  </div>
                                ))}
                                {reservations.length === 0 && (
                                  <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>Henüz bilet ayırtan üye yok.</p>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                    {events.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Henüz etkinlik eklenmemiş.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- BİLET MERKEZİ --- */}
            {activeTab === 'tickets' && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                <ion-icon name="ticket-outline" style={{ fontSize: '3rem', color: 'var(--primary-gold)', display: 'block', margin: '0 auto 1rem' }} />
                <h2 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Bilet Satış ve Kontrol Paneli</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Bilet satışı, koltuk haritası ve bilet taraması için ayrı paneli kullanın.</p>
                <Link href="/members/tickets" style={{ padding: '0.85rem 2rem', background: 'var(--primary-gold)', color: '#000', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block' }}>
                  Bilet Paneline Git →
                </Link>
              </div>
            )}

            {/* --- SİTE GÖRÜNÜMÜ --- */}
            {activeTab === 'site' && (role === 'SUPERADMIN' || role === 'ADMIN') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Gişe & Biletimi Bul Açma/Kapatma Paneli */}
                <div style={{ background: 'var(--bg-surface)', border: `1px solid ${siteConfig?.isTicketQueryActive !== false ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <ion-icon name="qr-code-outline" style={{ fontSize: '1.3rem', color: siteConfig?.isTicketQueryActive !== false ? '#10b981' : '#ef4444' }} />
                        <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                          Biletimi Bul / Gişe Durumu
                        </h2>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          background: siteConfig?.isTicketQueryActive !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: siteConfig?.isTicketQueryActive !== false ? '#10b981' : '#ef4444',
                          border: `1px solid ${siteConfig?.isTicketQueryActive !== false ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          {siteConfig?.isTicketQueryActive !== false ? '● AÇIK (Canlıda Görünür)' : '○ KAPALI (Gizlendi)'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '650px', margin: 0 }}>
                        Oyun sezonunda seyircilerin bilet sorgulayabilmesi için bu özelliği açık tutun. Aktif oyun olmadığında kapatarak menüden ve ana sayfadan otomatik olarak kaldırabilirsiniz.
                      </p>
                    </div>

                    <form action={updateSiteConfig as any}>
                      <input type="hidden" name="isTicketQueryActive" value={siteConfig?.isTicketQueryActive !== false ? 'false' : 'true'} />
                      <button
                        type="submit"
                        style={{
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          border: siteConfig?.isTicketQueryActive !== false ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          background: siteConfig?.isTicketQueryActive !== false ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-gold)',
                          color: siteConfig?.isTicketQueryActive !== false ? '#ef4444' : '#000',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <ion-icon name={siteConfig?.isTicketQueryActive !== false ? 'power-outline' : 'checkmark-circle-outline'} />
                        {siteConfig?.isTicketQueryActive !== false ? 'Gişeyi Kapat (Gizle)' : 'Gişeyi Aç (Yayınla)'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Site Yapılandırması İstemci Formu */}
                <SiteConfigForm siteConfig={siteConfig} />

                {/* Pinlenmiş slaytlar */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
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
                          <div key={p.id} style={{ padding: '0.65rem 1rem', background: isPinned ? 'var(--primary-gold-dim)' : 'var(--bg-surface-elevated)', borderRadius: '8px', border: isPinned ? '1px solid var(--primary-gold-border)' : '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: isPinned ? 'var(--primary-gold)' : 'var(--text-main)', fontSize: '0.875rem', fontWeight: isPinned ? 'bold' : 'normal' }}>
                              {isPinned && '📌 '}{p.title}
                            </span>
                            <form action={updateSiteConfig as any}>
                              <input type="hidden" name="pinnedSlides" value={JSON.stringify(
                                isPinned
                                  ? (siteConfig?.pinnedSlides || []).filter((id: string) => id !== p.id)
                                  : [...(siteConfig?.pinnedSlides || []), p.id]
                              )} />
                              <button type="submit" style={{ padding: '0.35rem 0.75rem', border: `1px solid ${isPinned ? 'var(--primary-gold-border)' : 'var(--border-medium)'}`, borderRadius: '6px', background: 'transparent', color: isPinned ? 'var(--primary-gold)' : 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}>
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
                          <div key={p.id} style={{ padding: '0.65rem 1rem', background: isPinned ? 'var(--primary-gold-dim)' : 'var(--bg-surface-elevated)', borderRadius: '8px', border: isPinned ? '1px solid var(--primary-gold-border)' : '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: isPinned ? 'var(--primary-gold)' : 'var(--text-main)', fontSize: '0.875rem', fontWeight: isPinned ? 'bold' : 'normal' }}>
                              {isPinned && '📌 '}{p.title}
                            </span>
                            <form action={updateSiteConfig as any}>
                              <input type="hidden" name="pinnedSlides" value={JSON.stringify(
                                isPinned
                                  ? (siteConfig?.pinnedSlides || []).filter((id: string) => id !== p.id)
                                  : [...(siteConfig?.pinnedSlides || []), p.id]
                              )} />
                              <button type="submit" style={{ padding: '0.35rem 0.75rem', border: `1px solid ${isPinned ? 'var(--primary-gold-border)' : 'var(--border-medium)'}`, borderRadius: '6px', background: 'transparent', color: isPinned ? 'var(--primary-gold)' : 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer' }}>
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

            {/* İŞ & GÖREV İLANLARI VE GELEN BAŞVURULAR SEKME İÇERİĞİ */}
            {activeTab === 'needs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. GELEN BAŞVURULAR KARTI */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <h2 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📥 Gelen Ekip Başvuruları ({teamApplications.length})
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        Üyelerin açık ekip ilanlarına yaptıkları başvurular ve motivasyon notları.
                      </p>
                    </div>
                  </div>

                  {teamApplications.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                      Henüz bir ekip ilanına başvuru yapılmamış.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                            {['Aday / Üye', 'Aranan Görev', 'Bölüm', 'İletişim & WhatsApp', 'Aday Notu', 'Başvuru Tarihi', ''].map((h, i) => (
                              <th key={`${h}-${i}`} style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {teamApplications.map((app: any) => {
                            const rawDigits = (app.userPhone || '').replace(/\D/g, '');
                            const waDigits = rawDigits.startsWith('90') ? rawDigits.slice(2) : (rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits);
                            const waLink = waDigits.length === 10 ? `https://wa.me/90${waDigits}` : '';

                            return (
                              <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '0.875rem', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                                  {app.userName || 'İsimsiz Üye'}
                                </td>
                                <td style={{ padding: '0.875rem' }}>
                                  <span style={{ padding: '0.25rem 0.6rem', background: 'var(--primary-gold-dim)', border: '1px solid var(--primary-gold-border)', borderRadius: '6px', color: 'var(--primary-gold)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    🎯 {app.roleName}
                                  </span>
                                </td>
                                <td style={{ padding: '0.875rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {app.userDepartment || '—'}
                                </td>
                                <td style={{ padding: '0.875rem', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{app.userPhone || app.userEmail}</span>
                                    {waLink && (
                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                      >
                                        <ion-icon name="logo-whatsapp" /> WhatsApp Sohbeti Aç →
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '0.875rem', maxWidth: '280px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {app.note ? (
                                    <span style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>&ldquo;{app.note}&rdquo;</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-dim)' }}>Not eklenmedi</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.875rem', color: 'var(--text-dim)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                  {app.createdAt ? new Date(app.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </td>
                                <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                                  <form action={deleteTeamApplication as any}>
                                    <input type="hidden" name="appId" value={app.id} />
                                    <button
                                      type="submit"
                                      title="Başvuruyu Kaldır"
                                      style={{ padding: '0.35rem 0.65rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', background: 'transparent', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                      Kaldır
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. İLAN YAYINLAMA VE MEVCUT İLANLAR KARTI */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Yeni İlan Ekle Formu */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      + Yeni Ekip / Görev İlanı Yayınla
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                      Kulüp üyelerinin başvurabileceği açık görev ve personel ilanları oluşturun.
                    </p>

                    <form action={addTeamNeed as any} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Aranan Görev / Yetenek Adı</label>
                        <input
                          type="text"
                          name="roleName"
                          placeholder="Örn: Dekor Amiri, Işık Masası Sorumlusu, Afiş Tasarımcısı"
                          required
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>İlan Açıklaması & Beklentiler</label>
                        <textarea
                          name="description"
                          rows={4}
                          placeholder="Görev kapsamı, çalışma saatleri ve aranan özellikler..."
                          required
                          style={{ ...inputStyle, resize: 'vertical' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', fontSize: '0.875rem' }}
                      >
                        İlanı Yayınla
                      </button>
                    </form>
                  </div>

                  {/* Mevcut Açık İlanlar */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Açık İlanlar ({teamNeeds.length})
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                      Şu an Üye Panosu'nda aktif olarak yayında olan ilanlar.
                    </p>

                    {teamNeeds.length === 0 ? (
                      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Henüz açık bir ilan bulunmuyor.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {teamNeeds.map((need: any) => (
                          <div
                            key={need.id}
                            style={{
                              padding: '1rem',
                              background: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                              <h4 style={{ color: 'var(--primary-gold)', fontWeight: 'bold', fontSize: '0.95rem', margin: 0 }}>
                                🎯 {need.roleName}
                              </h4>
                              <form action={deleteTeamNeed as any}>
                                <input type="hidden" name="needId" value={need.id} />
                                <button
                                  type="submit"
                                  title="İlanı Sil"
                                  style={{ padding: '0.25rem 0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', background: 'transparent', color: '#f87171', fontSize: '0.7rem', cursor: 'pointer' }}
                                >
                                  İlanı Kapat / Sil
                                </button>
                              </form>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>
                              {need.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
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
      <div style={{ padding: '10rem 5%', color: 'var(--text-main)', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Panel Yüklenemedi</h1>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Sistemde geçici bir sorun oluştu. Lütfen daha sonra tekrar deneyin.</p>
        <div style={{ marginTop: '2rem' }}>
          <Link href="/" className="btn btn-outline">Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }
}
