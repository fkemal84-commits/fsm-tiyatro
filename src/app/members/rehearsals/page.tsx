import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { addRehearsal, deleteRehearsal, startInstantAttendance, activateRehearsalPulse } from "@/app/actions";
import NudgeButton from "@/components/NudgeButton";
import DeleteButton from "@/components/DeleteButton";
import AttendanceManager from "@/components/AttendanceManager";
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

  const playsSnap = await adminDb.collection('plays').get();
  const allPlays = playsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
  const allRehearsals = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Kullanıcı yalnızca kendi oyunu/katılımcısı olduğu provaları görür
  const userRehearsals = allRehearsals.filter(r => {
    if (userIsAdmin) return true;
    const play = r.playId ? allPlays.find(p => p.id === r.playId) : null;
    return canManageEvent(user, r) || isEventParticipant(user, r, play);
  });

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });

  const activeRehearsals = userRehearsals.filter(r => r.pulseActive === true);
  
  const upcomingRehearsals = userRehearsals.filter(r => {
    if (r.pulseActive) return false;
    if (!r.date) return false;
    const rDate = r.date.split(' - ')[0];
    return rDate >= todayStr;
  });

  const pastRehearsals = userRehearsals.filter(r => {
    if (r.pulseActive) return false;
    if (!r.date) return false;
    const rDate = r.date.split(' - ')[0];
    return rDate < todayStr;
  });

  const usersSnap = await adminDb.collection('users').get();
  const allTeam = usersSnap.docs
    .map(doc => {
      const d = doc.data();
      const rawName = d.name || '';
      const rawSurname = d.surname || '';
      const cleanFirst = rawName.replace(/undefined/gi, '').trim();
      const cleanLast = rawSurname.replace(/undefined/gi, '').trim();
      return { id: doc.id, name: cleanFirst, surname: cleanLast, role: d.role };
    })
    .filter(u => u.name && u.role !== 'USER')
    .sort((a, b) => a.name.localeCompare(b.name));

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
    const isInstant = r.date?.includes('(Anlık)');
    const isActive = r.pulseActive === true;
    
    return (
      <div key={r.id} className="p-6 rounded-2xl border transition-all relative overflow-hidden bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]">
        {/* Durum Rozetleri */}
        <div className="absolute top-0 right-0 flex">
           {isActive && (
             <div className="bg-red-500 text-white text-[9px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest animate-pulse shadow-md">
               CANLI YOKLAMA
             </div>
           )}
           {isInstant && !isActive && (
             <div className="bg-[var(--bg-surface-elevated)] text-[var(--text-dim)] text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
               ANLIK KAYIT
             </div>
           )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6 mt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                 isActive ? 'bg-red-500/15 text-red-500' : 'bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] border border-[var(--primary-gold-border)]'
               }`}>
                 <ion-icon name={isInstant ? "flash" : "calendar-number"}></ion-icon>
               </div>
               <div>
                  <h3 className="text-[var(--text-main)] text-xl font-bold tracking-tight leading-none mb-1">{r.title}</h3>
                  <p className="text-[10px] text-[var(--text-dim)] uppercase font-bold tracking-widest">{r.id.slice(-6)} • PROVA KAYDI</p>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-auto">
            {canManage && (
              <>
                <DeleteButton 
                  action={deleteRehearsal as any} 
                  id={r.id} 
                  name={r.title} 
                  confirmMessage="Bu prova kaydını silmek istediğinize emin misiniz?" 
                  idFieldName="rehearsalId"
                />
                {!isInstant && isUpcoming && !isActive && (
                   <form action={async () => { 'use server'; await activateRehearsalPulse(r.id); }}>
                     <button type="submit" className="btn btn-primary py-2.5 px-5 rounded-xl text-[11px] font-bold tracking-wider uppercase border-none flex items-center gap-2">
                       <ion-icon name="play-circle-outline" style={{ fontSize: '1.1rem' }}></ion-icon>
                       Yoklamayı Başlat
                     </button>
                   </form>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-4 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] flex items-center justify-center text-[var(--primary-gold)] text-lg border border-[var(--border-subtle)]">
              <ion-icon name="time-outline"></ion-icon>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-dim)] uppercase font-bold">Planlanan Vakit</span>
              <span className="text-sm font-bold text-[var(--text-main)]">{r.date || 'Belirtilmedi'}</span>
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
          <div className="mb-6 p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-dashed border-[var(--border-medium)] relative">
            <div className="text-[var(--primary-gold)] text-[10px] font-bold tracking-wider mb-1">YÖNETMEN NOTU:</div>
            <p className="text-[var(--text-muted)] text-xs italic leading-relaxed">{r.notes}</p>
          </div>
        )}
  
        {(canManage && (isActive || !isUpcoming)) && (
          <div className="pt-6 border-t border-[var(--border-subtle)] mt-2">
            <AttendanceManager 
              rehearsalId={r.id} 
              allUsers={allTeam} 
              initialAttendance={r.attendance || {}} 
              initialNotes={r.attendanceNotes}
              pulseResponses={r.pulseResponses || []}
            />
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
             <Link href="/members/attendance" className="btn btn-outline border-red-500 text-red-500 flex items-center gap-2 hover:bg-red-500 hover:text-white py-2 px-5 rounded-full text-xs font-bold transition-all whitespace-nowrap">
               <ion-icon name="clipboard-outline" style={{ fontSize: '1.1rem' }}></ion-icon>
               Yoklama Paneli
             </Link>
             <form action={startInstantAttendance as any}>
               <button type="submit" className="btn btn-primary flex items-center gap-2 py-2 px-5 rounded-full text-xs font-bold transition-all whitespace-nowrap">
                 <ion-icon name="flashlight-outline"></ion-icon>
                 Anlık Yoklama Başlat
               </button>
             </form>
             <NudgeButton users={allTeam} />
           </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {view === 'calendar' ? (
           <RehearsalCalendar rehearsals={allRehearsals} />
        ) : (
          <>
            {/* CANLI YOKLAMA BÖLÜMÜ */}
            {activeRehearsals.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-red-500 text-xl font-bold serif-font flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                    Canlı Yoklama Açık!
                  </h2>
                  <div className="h-[1px] flex-1 bg-red-500/20"></div>
                </div>
                <div className="space-y-6">
                  {activeRehearsals.map(r => renderRehearsalCard(r, true))}
                </div>
              </section>
            )}

            {/* YENİ PROVA EKLEME FORMU */}
            {canManage && (
              <section className="glass-card bg-[var(--bg-surface)] border-dashed border-[var(--primary-gold-border)]">
                <h2 className="text-[var(--primary-gold)] text-lg mb-6 flex items-center gap-2 font-bold uppercase tracking-wider">
                  <ion-icon name="add-circle-outline" style={{ fontSize: '1.3rem' }}></ion-icon> 
                  Yeni Prova Takvimi Oluştur
                </h2>
                <form action={addRehearsal as any} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase">PROVA KONUSU / OYUN</label>
                    <input 
                      type="text" 
                      name="title" 
                      list="presetTitles"
                      placeholder="Örn: Hamlet 1. Perde" 
                      style={inputStyle} 
                      required 
                    />
                    <datalist id="presetTitles">
                      {presetTitles.map((t: any) => <option key={t as string} value={t as string} />)}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase">MEKAN / SAHNE</label>
                    <input 
                      type="text" 
                      name="location" 
                      list="presetLocations"
                      placeholder="Örn: Haliç Yerleşkesi" 
                      style={inputStyle} 
                      required 
                    />
                    <datalist id="presetLocations">
                      {presetLocations.map((l: any) => <option key={l as string} value={l as string} />)}
                    </datalist>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 md:col-span-2">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase">TARİH</label>
                      <input type="date" name="rehearsalDate" style={inputStyle} required />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase">SAAT</label>
                      <input 
                        type="time" 
                        name="rehearsalTime" 
                        list="presetTimes"
                        style={inputStyle} 
                        required 
                      />
                      <datalist id="presetTimes">
                        {presetTimes.map((t: any) => <option key={t as string} value={t as string} />)}
                      </datalist>
                    </div>
                  </div>

                  <textarea name="notes" placeholder="Yönetmen Notu (Opsiyonel)" style={{ ...inputStyle, minHeight: '90px' }} className="md:col-span-2" />
                  
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input type="checkbox" name="saveAsPreset" id="saveAsPreset" className="accent-[var(--primary-gold)]" />
                    <label htmlFor="saveAsPreset" className="text-xs text-[var(--text-muted)] cursor-pointer">Bu bilgileri şablon olarak kaydet</label>
                  </div>

                  <button type="submit" className="md:col-span-2 btn btn-primary py-3.5 font-bold tracking-wider text-xs mt-2">
                    Provayı Kaydet
                  </button>
                </form>
              </section>
            )}

            {/* GELECEK PROVA TAKVİMİ */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[var(--text-main)] text-2xl font-bold serif-font">Gelecek Prova Takvimi</h2>
                <div className="h-[1px] flex-1 bg-[var(--border-subtle)]"></div>
              </div>
              
              {upcomingRehearsals.length === 0 ? (
                <div className="p-10 text-center glass-card bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                    <p className="text-[var(--text-muted)] italic text-sm">Şu an için planlanmış aktif bir prova bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingRehearsals.map(r => renderRehearsalCard(r, true))}
                </div>
              )}
            </section>

            {/* GEÇMİŞ PROVA LOGLARI (ARŞİV) */}
            {canManage && pastRehearsals.length > 0 && (
              <section className="mt-16 pt-12 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-4 mb-8">
                   <h2 className="text-[var(--text-muted)] text-lg font-bold serif-font uppercase tracking-wider">Geçmiş Prova Kayıtları ({pastRehearsals.length})</h2>
                   <div className="h-[1px] flex-1 bg-[var(--border-subtle)]"></div>
                </div>
                <div className="space-y-6 opacity-75 hover:opacity-100 transition-opacity">
                  {pastRehearsals.map(r => renderRehearsalCard(r, false))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
