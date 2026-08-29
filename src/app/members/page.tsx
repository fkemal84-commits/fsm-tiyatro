import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { addTeamNeed, deleteTeamNeed, addEvent } from "@/app/actions";
import { getWhatsAppEventLink } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import JoinEventButton from "../../components/JoinEventButton";
import EventTicketButton from "@/components/EventTicketButton";
import ScriptVault from "@/components/ScriptVault";
import ScrollReveal from "@/components/ScrollReveal";
import TeamNeedApplyButton from "@/components/TeamNeedApplyButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Üye Panosu",
  description: "FSM Tiyatro üyelerine özel prova takvimi ve ekip duyuruları.",
};

export default async function MembersDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const canAdd = role === 'ADMIN' || role === 'SUPERADMIN';

  const rawName = session?.user?.name || '';
  const cleanName = rawName.replace(/undefined/gi, '').trim() || session?.user?.email?.split('@')[0] || 'Üye';

  const userEmail = session?.user?.email;
  let userApplications: string[] = [];
  const userReservationsMap: Record<string, { id: string; ticketCode: string }> = {};

  if (userEmail) {
    try {
      const [appsSnap, userSnap] = await Promise.all([
        adminDb.collection('teamApplications').where('userEmail', '==', userEmail).get(),
        adminDb.collection('users').where('email', '==', userEmail).limit(1).get()
      ]);
      userApplications = appsSnap.docs.map(doc => doc.data().needId);

      if (!userSnap.empty) {
        const uid = userSnap.docs[0].id;
        const resSnap = await adminDb.collection('eventReservations')
          .where('userId', '==', uid)
          .where('status', '==', 'ACTIVE')
          .get();

        resSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.eventId) {
            userReservationsMap[data.eventId] = {
              id: doc.id,
              ticketCode: data.ticketCode
            };
          }
        });
      }
    } catch {
      userApplications = [];
    }
  }

  const rehearsalsSnapshot = await adminDb.collection('events').get();
  const events = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const scriptsSnapshot = await adminDb.collection('scripts').get();
  const scripts = scriptsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const canManageScripts = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(role);

  const teamNeedsSnapshot = await adminDb.collection('teamNeeds').where('isActive', '==', true).get();
  const teamNeeds = teamNeedsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Editör ve Yazar Metrikleri
  const isEditor = ['EDITOR', 'ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(role);
  let editorPosts: any[] = [];
  if (isEditor && userEmail) {
    try {
      const postsSnap = await adminDb.collection('posts').where('authorEmail', '==', userEmail).get();
      editorPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    } catch {
      editorPosts = [];
    }
  }
  const totalViews = editorPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = editorPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);
  const mostReadPost = editorPosts.length > 0 ? [...editorPosts].sort((a, b) => (b.views || 0) - (a.views || 0))[0] : null;

  const inputStyle = {
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-medium)',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  };

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-16">
        <h1 className="serif-font text-5xl text-[var(--primary-gold)] mb-3">Üye Panosu</h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-sm">
          {session ? (
            <>Hoş geldin, <span className="text-[var(--text-main)] font-bold">{cleanName}</span>!</>
          ) : (
            <>FSM Vakıf Üniversitesi Sinema ve Tiyatro Kulübü <span className="text-[var(--text-main)] font-bold">Dijital Panosu</span></>
          )}
        </p>
      </header>

      <ScrollReveal>
        <div className="max-w-7xl mx-auto space-y-8">

        {/* EDİTÖR & YAZAR ÖZET KARTI */}
        {isEditor && (
          <div className="glass-card !p-6 sm:!p-8 bg-[var(--bg-surface)] border border-[var(--primary-gold-border)] rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6 mb-6">
              <div>
                <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1 font-mono">
                  ✍️ EDİTÖR & İÇERİK METRİKLERİ
                </span>
                <h2 className="serif-font text-2xl text-[var(--text-main)] font-bold">
                  Yazı Performansın & Kulis Masası
                </h2>
              </div>
              <Link
                href="/kulis/yeni"
                className="btn btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 flex-shrink-0 self-start sm:self-auto shadow-md hover:scale-105 transition-all"
              >
                <ion-icon name="create-outline" style={{ fontSize: '1.1rem' }}></ion-icon>
                <span>+ Yeni Yazı Yaz</span>
              </Link>
            </div>

            {/* Metrik Kutuları */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-1">Yayınlanan Yazı</span>
                <span className="text-2xl font-bold text-[var(--text-main)] font-mono">{editorPosts.length}</span>
              </div>
              <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-1">Toplam Okunma</span>
                <span className="text-2xl font-bold text-[var(--primary-gold)] font-mono">{totalViews}</span>
              </div>
              <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-1">Toplam Beğeni</span>
                <span className="text-2xl font-bold text-rose-400 font-mono">❤️ {totalLikes}</span>
              </div>
              <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-1">En Çok Okunan</span>
                <span className="text-xs font-bold text-[var(--text-main)] truncate block" title={mostReadPost?.title || '—'}>
                  {mostReadPost ? mostReadPost.title : '—'}
                </span>
              </div>
            </div>

            {/* Son Yazıların Hızlı Listesi */}
            {editorPosts.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider block mb-2">
                  Son Yazıların
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {editorPosts.slice(0, 3).map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/kulis/${p.id}`}
                      className="p-3 bg-[var(--bg-surface-elevated)] hover:bg-[var(--primary-gold-dim)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] rounded-xl transition-all block group"
                    >
                      <span className="text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--primary-gold)] line-clamp-1">
                        {p.title}
                      </span>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--text-dim)] mt-1.5 font-mono">
                        <span>👁️ {p.views || 0} okuma</span>
                        <span>❤️ {p.likes?.length || 0} beğeni</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ETKİNLİKLER KARTI */}
        <div className="glass-card">
          <h2 className="text-[var(--text-main)] text-2xl mb-6 border-b border-[var(--border-subtle)] pb-4 flex items-center gap-2 font-bold">
            Yaklaşan Etkinlikler
          </h2>
          
          {canAdd && (
            <form action={addEvent as any} className="mb-6 bg-[var(--primary-gold-dim)] p-6 rounded-xl flex flex-col gap-3 border border-dashed border-[var(--primary-gold-border)]">
              <h4 className="text-[var(--primary-gold)] text-sm font-bold">+ Yeni Etkinlik Ekle (Yönetici)</h4>
              <input type="text" name="title" placeholder="Etkinlik Adı" style={inputStyle} required />
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary-gold)] pointer-events-none text-sm">
                    <ion-icon name="calendar-outline"></ion-icon>
                  </span>
                  <input 
                    type="date" 
                    name="eventDate" 
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
                    required 
                  />
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary-gold)] pointer-events-none text-sm">
                    <ion-icon name="time-outline"></ion-icon>
                  </span>
                  <input 
                    type="time" 
                    name="eventTime" 
                    style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
                    required 
                  />
                </div>
              </div>
              <input type="text" name="location" placeholder="Konum" style={inputStyle} required />
              <textarea name="description" placeholder="Etkinlik Detayları..." style={inputStyle} rows={2}></textarea>
              <button type="submit" className="btn btn-primary mt-2">
                Etkinliği Yayınla
              </button>
            </form>
          )}

          {events.length === 0 ? (
            <p className="text-[var(--text-dim)] text-sm">Şu an için planlanmış bir etkinlik bulunmuyor.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((e: any) => (
                <li key={e.id} className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-[var(--primary-gold)] font-bold text-lg">📢 {e.title}</h4>
                    {canAdd && (
                      <a 
                        href={getWhatsAppEventLink(e)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-[#25D366] text-white p-2 rounded-lg flex items-center justify-center hover:scale-105 transition-all text-xs gap-1 font-bold"
                        title="WhatsApp grubunda duyur"
                      >
                        <ion-icon name="logo-whatsapp"></ion-icon> Duyur
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-[var(--text-main)]">⏰ {e.date}</div>
                  <div className="text-sm text-[var(--text-muted)] mb-3">📍 {e.location}</div>
                  {e.description && <p className="text-xs text-[var(--text-muted)] mb-4 bg-[var(--bg-card)] p-2 rounded-lg border border-[var(--border-subtle)]">{e.description}</p>}
                  
                  {e.isTicketed ? (
                    <EventTicketButton 
                      eventId={e.id}
                      eventTitle={e.title}
                      isTicketed={e.isTicketed}
                      ticketQuota={e.ticketQuota || 0}
                      reservedCount={e.reservedCount || 0}
                      isLoggedIn={!!session}
                      initialReservation={userReservationsMap[e.id] || null}
                    />
                  ) : (
                    <JoinEventButton eventId={e.id} eventTitle={e.title} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* EKİP İHTİYAÇLARI */}
        <div className="glass-card">
          <h2 className="text-[var(--text-main)] text-2xl mb-6 border-b border-[var(--border-subtle)] pb-4 flex items-center gap-2 font-bold">
            Ekip İhtiyaç İlanları
          </h2>

          {canAdd && (
             <form action={addTeamNeed as any} className="mb-6 bg-[var(--primary-gold-dim)] p-6 rounded-xl flex flex-col gap-3 border border-dashed border-[var(--primary-gold-border)]">
              <h4 className="text-[var(--primary-gold)] text-sm font-bold">+ Yeni Personel Açığı Ekle (Yönetici)</h4>
              <input type="text" name="roleName" placeholder="Aranan Yetenek" style={inputStyle} required />
              <textarea name="description" placeholder="Beklentilerimiz..." rows={3} style={inputStyle} required></textarea>
              <button type="submit" className="btn btn-primary mt-2">
                İlanı Yayınla
              </button>
            </form>
          )}

          {teamNeeds.length === 0 ? (
            <p className="text-[var(--text-dim)] text-sm">Şu an için açık bir ekip personel ilanı yok.</p>
          ) : (
            <ul className="space-y-4">
              {teamNeeds.map((t: any) => {
                const hasApplied = userApplications.includes(t.id);
                return (
                  <li key={t.id} className="p-5 bg-[var(--bg-surface-elevated)] border border-[var(--primary-gold-border)] rounded-xl transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-[var(--text-main)] font-bold text-xl">🎯 {t.roleName} Aranıyor!</h4>
                      {canAdd && (
                        <form action={deleteTeamNeed as any}>
                          <input type="hidden" name="needId" value={t.id} />
                          <button
                            type="submit"
                            title="İlanı Sil"
                            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-500/30 hover:border-red-500"
                          >
                            İlanı Kaldır
                          </button>
                        </form>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{t.description}</p>
                    <TeamNeedApplyButton needId={t.id} roleName={t.roleName} hasApplied={hasApplied} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* SENARYO KÜTÜPHANESİ - SADECE YETKİLİLER VE AKTÖRLERE ÖZEL */}
        <div className="md:col-span-2">
          {['AKTOR', 'PLAYER', 'DIRECTOR', 'ASST_DIRECTOR', 'SUPERADMIN', 'ADMIN'].includes(role) && (
            <ScriptVault initialScripts={scripts} canManage={canManageScripts} />
          )}
        </div>

        </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
