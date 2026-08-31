import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { createEvent, deleteUnifiedEvent, openAttendanceSession } from "@/app/actions";
import DeleteButton from "@/components/DeleteButton";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import RehearsalCalendar from "@/components/RehearsalCalendar";
import { canManageEvent, isEventParticipant } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Özel Prova Takvimi",
  description: "Oyuncu ve yöneticilere özel detaylı prova takvimi.",
};

export const dynamic = 'force-dynamic';

export default async function RehearsalsPage(props: { searchParams: Promise<{ view?: string }> }) {
  const searchParams = await props.searchParams;
  const view = searchParams.view || 'list';
  
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Sadece Admin, Aktör ve Yönetmenler girebilir
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'AKTOR', 'MEMBER'];
  if (!allowedRoles.includes(role)) {
    redirect('/members');
  }

  const canManage = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(role) && (session?.user as any)?.isAdminMode;
  const user = session?.user as any;
  const userIsAdmin = role === 'SUPERADMIN' || role === 'ADMIN';

  // Oyunları getir
  const playsSnap = await adminDb.collection('plays').get();
  const allPlays = playsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  // Prova etkinliklerini tekil events koleksiyonundan getir
  const eventsSnapshot = await adminDb.collection('events').get();
  const allProvas = eventsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .filter(e => e.type === 'PROVA' || e.type === 'Okuma Tiyatrosu' || !e.type)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Aktif açık QR yoklama oturumlarını çek
  const now = Date.now();
  const openSessionsSnap = await adminDb.collection('attendance_sessions')
    .where('status', '==', 'OPEN')
    .get();
  const activeSessionEventMap = new Map<string, string>();
  openSessionsSnap.docs.forEach(d => {
    const sData = d.data();
    if (!sData.expiresAt || sData.expiresAt > now) {
      activeSessionEventMap.set(sData.eventId, d.id);
    }
  });

  // Kullanıcı yalnızca kendi oyunu/katılımcısı olduğu provaları görür
  const userRehearsals = allProvas.filter(r => {
    if (userIsAdmin) return true;
    const play = r.playId ? allPlays.find(p => p.id === r.playId) : null;
    return canManageEvent(user, r) || isEventParticipant(user, r, play);
  });

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });

  const activeRehearsals = userRehearsals.filter(r => activeSessionEventMap.has(r.id));
  
  const upcomingRehearsals = userRehearsals.filter(r => {
    if (activeSessionEventMap.has(r.id)) return false;
    if (!r.date) return false;
    const rDate = r.date.split(' - ')[0];
    return rDate >= todayStr;
  });

  const pastRehearsals = userRehearsals.filter(r => {
    if (activeSessionEventMap.has(r.id)) return false;
    if (!r.date) return false;
    const rDate = r.date.split(' - ')[0];
    return rDate < todayStr;
  });

  const presetsSnap = await adminDb.collection('presets').where('type', '==', 'rehearsal').get();
  const presets = presetsSnap.docs.map(doc => doc.data());
  
  const presetTitles = Array.from(new Set(presets.map(p => p.title).filter(Boolean)));
  const presetLocations = Array.from(new Set(presets.map(p => p.location).filter(Boolean)));
  const presetTimes = Array.from(new Set(presets.map(p => p.time).filter(Boolean)));

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

  const renderRehearsalCard = (r: any, isUpcoming: boolean = false) => {
    const hasLiveSession = activeSessionEventMap.has(r.id);
    const liveSessionId = activeSessionEventMap.get(r.id);
    
    return (
      <div key={r.id} className="p-6 rounded-2xl border transition-all relative overflow-hidden bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]">
        {/* Durum Rozeti */}
        {hasLiveSession && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest animate-pulse shadow-md">
            CANLI QR YOKLAMA AÇIK
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6 mt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                 hasLiveSession ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] border border-[var(--primary-gold-border)]'
               }`}>
                 <ion-icon name="calendar-number"></ion-icon>
               </div>
               <div>
                  <h3 className="text-[var(--text-main)] text-xl font-bold tracking-tight leading-none mb-1">{r.title}</h3>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">{r.id.slice(-6)} • {r.playTitle || 'PROVA KAYDI'}</p>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
            {hasLiveSession ? (
              <Link
                href={`/members/attendance?session=${liveSessionId}`}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
              >
                <ion-icon name="qr-code-outline"></ion-icon>
                <span>{canManage ? 'Canlı QR Paneli' : 'QR Oku & Katıl'}</span>
              </Link>
            ) : canManage && isUpcoming ? (
              <form action={async () => {
                'use server';
                await openAttendanceSession(r.id);
              }}>
                <button type="submit" className="btn btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <ion-icon name="qr-code-outline"></ion-icon>
                  <span>Canlı QR Başlat</span>
                </button>
              </form>
            ) : null}

            {canManage && (
              <DeleteButton 
                action={deleteUnifiedEvent as any} 
                id={r.id} 
                name={r.title} 
                confirmMessage="Bu prova kaydını silmek istediğinize emin misiniz?" 
                idFieldName="eventId"
              />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-4 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] flex items-center justify-center text-[var(--primary-gold)] text-lg border border-[var(--border-subtle)]">
              <ion-icon name="time-outline"></ion-icon>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-dim)] uppercase font-bold">Prova Tarihi</span>
              <span className="text-sm font-bold text-[var(--text-main)] font-mono">{r.date || 'Tarih Belirtilmedi'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] flex items-center justify-center text-[var(--primary-gold)] text-lg border border-[var(--border-subtle)]">
              <ion-icon name="map-outline"></ion-icon>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-dim)] uppercase font-bold">Prova Mekanı</span>
              <span className="text-sm font-bold text-[var(--text-main)]">{r.location || 'Haliç Yerleşkesi'}</span>
            </div>
          </div>
        </div>
  
        {r.notes && (
          <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-dashed border-[var(--border-medium)] relative">
            <div className="text-[var(--primary-gold)] text-[10px] font-bold tracking-wider mb-1">YÖNETMEN NOTU:</div>
            <p className="text-[var(--text-muted)] text-xs italic leading-relaxed">{r.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-12">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-6 max-w-4xl mx-auto">
          <div className="text-left">
            <h1 className="serif-font text-4xl sm:text-5xl text-[var(--text-main)] mb-2">Prova <span className="text-[var(--primary-gold)]">Takvimi</span></h1>
            <p className="text-[var(--text-muted)] text-sm mb-4">Planlanan ve tamamlanan provalar.</p>
            
            {/* GÖRÜNÜM DEĞİŞTİRİCİ */}
            <div className="inline-flex p-1 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
              <Link 
                href="/members/rehearsals?view=list" 
                className={`px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${view !== 'calendar' ? 'bg-[var(--primary-gold)] text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                LİSTE
              </Link>
              <Link 
                href="/members/rehearsals?view=calendar" 
                className={`px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${view === 'calendar' ? 'bg-[var(--primary-gold)] text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                TAKVİM 🗓️
              </Link>
            </div>
          </div>

          {canManage && (
             <div className="flex flex-col sm:flex-row gap-3">
             <Link href="/members/attendance" className="btn btn-outline border-[var(--primary-gold)] text-[var(--primary-gold)] flex items-center gap-2 hover:bg-[var(--primary-gold)] hover:text-black py-2 px-5 rounded-full text-xs font-bold transition-all whitespace-nowrap">
               <ion-icon name="qr-code-outline" style={{ fontSize: '1rem' }}></ion-icon>
               Yoklama Paneli
             </Link>
             </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {canManage && (
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <h2 className="serif-font text-2xl text-[var(--text-main)] mb-6 flex items-center gap-3">
              <ion-icon name="add-circle-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
              Yeni Prova Planla
            </h2>

            <form action={createEvent as any} className="space-y-4">
              <input type="hidden" name="type" value="PROVA" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-[var(--text-dim)] mb-2">PROVA ADI / KONUSU</label>
                  <input
                    type="text"
                    name="title"
                    list="preset-titles"
                    placeholder="Örn: 2. Perde Akış Provası"
                    required
                    style={inputStyle}
                  />
                  {presetTitles.length > 0 && (
                    <datalist id="preset-titles">
                      {presetTitles.map((t, idx) => <option key={idx} value={t as string} />)}
                    </datalist>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-[var(--text-dim)] mb-2">İLGİLİ OYUN / PROJE</label>
                  <select name="playId" style={inputStyle}>
                    <option value="">Genel Prova (Tüm Ekip)</option>
                    {allPlays.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-[var(--text-dim)] mb-2">TARİH</label>
                  <input type="date" name="eventDate" required style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-[var(--text-dim)] mb-2">SAAT</label>
                  <input type="time" name="eventTime" list="preset-times" required style={inputStyle} />
                  {presetTimes.length > 0 && (
                    <datalist id="preset-times">
                      {presetTimes.map((t, idx) => <option key={idx} value={t as string} />)}
                    </datalist>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-[var(--text-dim)] mb-2">MEKAN</label>
                  <input type="text" name="location" list="preset-locations" defaultValue="Haliç Yerleşkesi" style={inputStyle} />
                  {presetLocations.length > 0 && (
                    <datalist id="preset-locations">
                      {presetLocations.map((l, idx) => <option key={idx} value={l as string} />)}
                    </datalist>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[var(--text-dim)] mb-2">KATILIMCI KAPSAMI</label>
                <select name="participantScope" style={inputStyle}>
                  <option value="PROJECT_MEMBERS">Oyun / Proje Kadrosu (Varsayılan)</option>
                  <option value="ALL_MEMBERS">Tüm Kulüp Üyeleri</option>
                  <option value="SELECTED_USERS">Özel Katılımcı Listesi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-[var(--text-dim)] mb-2">YÖNETMEN NOTLARI / AÇIKLAMA</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Prova öncesi hazırlanması gereken sahneler, kostüm vb. notlar..."
                  style={inputStyle}
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="btn btn-primary px-8 py-3 text-xs font-bold tracking-wider uppercase">
                  Provayı Yayınla & Bildir
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'calendar' ? (
          <RehearsalCalendar rehearsals={userRehearsals} />
        ) : (
          <div className="space-y-10">
            {/* AKTİF CANLI YOKLAMA OLAN PROVALAR */}
            {activeRehearsals.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                  <h2 className="text-emerald-400 text-xl font-bold uppercase tracking-wider">Canlı Yoklaması Açık Provalar</h2>
                </div>
                <div className="space-y-4">
                  {activeRehearsals.map(r => renderRehearsalCard(r, true))}
                </div>
              </section>
            )}

            {/* GELECEK PROVALAR */}
            <section>
              <h2 className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <ion-icon name="calendar-outline"></ion-icon> Yaklaşan Provalar ({upcomingRehearsals.length})
              </h2>
              {upcomingRehearsals.length === 0 ? (
                <div className="p-8 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] text-[var(--text-dim)] text-sm italic">
                  Kadrosunda yer aldığınız yaklaşan bir prova bulunmuyor.
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingRehearsals.map(r => renderRehearsalCard(r, true))}
                </div>
              )}
            </section>

            {/* GEÇMİŞ PROVALAR */}
            {pastRehearsals.length > 0 && (
              <section>
                <h2 className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <ion-icon name="checkmark-done-outline"></ion-icon> Tamamlanan Provalar ({pastRehearsals.length})
                </h2>
                <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                  {pastRehearsals.map(r => renderRehearsalCard(r, false))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
