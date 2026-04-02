import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { addRehearsal, deleteRehearsal, startInstantAttendance, activateRehearsalPulse } from "@/app/actions";
import NudgeButton from "@/components/NudgeButton";
import { getWhatsAppRehearsalLink } from "@/lib/utils";
import DeleteButton from "@/components/DeleteButton";
import AttendanceManager from "@/components/AttendanceManager";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import ArchiveWrapper from "@/components/ArchiveWrapper";
import RehearsalCalendar from "@/components/RehearsalCalendar";

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

  // Yönetim yetkisi sadece Admin Mode açıksa ve rölü uygunsa geçerli olsun
  const canManage = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(role) && (session?.user as any)?.isAdminMode;

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
  console.log(`[DEBUG_TIYATRO] Veritabanından gelen toplam prova sayısı: ${rehearsalsSnapshot.size}`);
  
  const allRehearsals = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const now = new Date();
  // Tarihleri karşılaştırmak için bugünü normalize et
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const parseRehearsalDate = (dateStr: string) => {
    if (!dateStr) return 0;
    if (dateStr.includes('(Anlık)')) return today + (24 * 60 * 60 * 1000); // 1 gün sonrası gibi say
    try {
      // Robust regex-based parsing
      const cleanStr = dateStr.trim();
      const match = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (!match) return 0;

      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);

      return new Date(year, month - 1, day).getTime();
    } catch {
      return 0;
    }
  };

  const activeRehearsals = allRehearsals.filter(r => r.pulseActive === true);
  const upcomingRehearsals = allRehearsals.filter(r => !r.pulseActive && parseRehearsalDate(r.date) >= today);
  const pastRehearsals = allRehearsals.filter(r => !r.pulseActive && parseRehearsalDate(r.date) < today);

  // Yoklama için kullanıcıları çek
  const usersSnap = await adminDb.collection('users').get();
  const allTeam = usersSnap.docs
    .map(doc => ({ id: doc.id, name: doc.data().name, surname: doc.data().surname, role: doc.data().role }))
    .filter(u => u.name && u.role !== 'USER')
    .sort((a, b) => a.name.localeCompare(b.name));

  // Presetleri çek
  const presetsSnap = await adminDb.collection('presets').where('type', '==', 'rehearsal').get();
  const presets = presetsSnap.docs.map(doc => doc.data());
  
  const presetTitles = Array.from(new Set(presets.map(p => p.title).filter(Boolean)));
  const presetLocations = Array.from(new Set(presets.map(p => p.location).filter(Boolean)));
  const presetTimes = Array.from(new Set(presets.map(p => p.time).filter(Boolean)));

  const renderRehearsalCard = (r: any, isUpcoming: boolean = false) => {
    const isInstant = r.date?.includes('(Anlık)');
    const isActive = r.pulseActive === true;
    
    return (
      <div key={r.id} className={`p-6 rounded-[2rem] border transition-all group relative overflow-hidden ${
        isActive 
          ? 'bg-red-500/[0.03] border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.05)]' 
          : 'bg-white/5 border-white/10 hover:border-[var(--primary-gold)]/50'
      }`}>
        {/* Durum Rozetleri */}
        <div className="absolute top-0 right-0 flex">
           {isActive && (
             <div className="bg-red-500 text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest animate-pulse shadow-lg">
               CANLI YAYINDA
             </div>
           )}
           {isInstant && !isActive && (
             <div className="bg-white/10 text-white/40 text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
               ANLIK LOG
             </div>
           )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 mt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                 isActive ? 'bg-red-500/20 text-red-500' : 'bg-[var(--primary-gold)]/10 text-[var(--primary-gold)] shadow-glow-sm'
               }`}>
                 <ion-icon name={isInstant ? "flash" : "calendar-number"}></ion-icon>
               </div>
               <div>
                  <h3 className="text-white text-2xl font-black tracking-tighter leading-none mb-1">{r.title}</h3>
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{r.id.slice(-6)} • LOG KAYDI</p>
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
                  confirmMessage="Bu yoklama kaydını ve bütün geçmişini kalıcı olarak silmek istediğine emin misin?" 
                  idFieldName="rehearsalId"
                />
                {!isInstant && isUpcoming && !isActive && (
                   <form action={async () => { 'use server'; await activateRehearsalPulse(r.id); }}>
                     <button type="submit" className="btn btn-primary py-3 px-6 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-glow bg-red-600 hover:bg-red-500 border-none flex items-center gap-2">
                       <ion-icon name="play-circle-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
                       YOKLAMAYI BAŞLAT
                     </button>
                   </form>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-4 bg-black/40 p-4 rounded-[1.5rem] border border-white/5 group-hover:border-white/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--primary-gold)] text-lg">
              <ion-icon name="time-outline"></ion-icon>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-white/20 uppercase font-black">Planlanan Vakit</span>
              <span className="text-sm font-bold text-white/90">{r.date || 'Belirtilmedi'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-black/40 p-4 rounded-[1.5rem] border border-white/5 group-hover:border-white/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--primary-gold)] text-lg">
              <ion-icon name="map-outline"></ion-icon>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-white/20 uppercase font-black">Prova Mekanı</span>
              <span className="text-sm font-bold text-white/90">{r.location || 'Haliç Yerleşkesi'}</span>
            </div>
          </div>
        </div>
  
        {r.notes ? (
          <div className="mb-8 p-5 bg-white/[0.02] rounded-2xl border border-dashed border-white/10 relative">
            <div className="absolute -top-3 left-6 px-3 bg-[#0a0a0a] text-[var(--primary-gold)] text-[9px] font-black tracking-widest border border-white/10 rounded-full">YÖNETMEN NOTU</div>
            <p className="text-white/50 text-xs italic leading-relaxed">{r.notes}</p>
          </div>
        ) : (
          <div className="h-4"></div>
        )}
  
        {(canManage && (isActive || !isUpcoming)) && (
          <div className="pt-8 border-t border-white/10 mt-2">
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
      <header className="text-center mb-16">
        <div className="flex justify-between items-center mb-10 flex-wrap gap-6">
          <div className="text-left">
            <h1 className="serif-font text-5xl text-white mb-2">Prova <span className="text-[var(--primary-gold)]">Takvimi</span></h1>
            <p className="text-white/60 mb-6">Disiplin, sahnenin ruhudur.</p>
            
            {/* GÖRÜNÜM DEGISTIRICI */}
            <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
              <Link 
                href="/members/rehearsals?view=list" 
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view !== 'calendar' ? 'bg-[var(--primary-gold)] text-black shadow-glow-sm scale-105' : 'text-white/40 hover:text-white hover:bg-white/5 opacity-60'}`}
              >
                LİSTE
              </Link>
              <Link 
                href="/members/rehearsals?view=calendar" 
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'calendar' ? 'bg-[var(--primary-gold)] text-black shadow-glow-sm scale-105' : 'text-white/40 hover:text-white hover:bg-white/5 opacity-60'}`}
              >
                TAKVİM 🗓️
              </Link>
            </div>
          </div>
          {canManage && (
             <div className="flex flex-col sm:flex-row gap-3">
             <Link href="/members/attendance" className="btn btn-outline border-red-500 text-red-500 flex items-center gap-2 hover:bg-red-500 hover:text-white py-2 px-6 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-[0_0_15px_rgba(239,68,68,0.1)]">
               <ion-icon name="clipboard-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
               YOKLAMA PANELİ 📋
             </Link>
             <form action={startInstantAttendance as any}>
               <button type="submit" className="btn btn-outline border-[var(--primary-gold)] text-[var(--primary-gold)] flex items-center gap-2 hover:bg-[var(--primary-gold)] hover:text-black py-2 px-6 rounded-full text-xs font-bold transition-all whitespace-nowrap">
                 <ion-icon name="flashlight-outline"></ion-icon>
                 ANLIK YOKLAMA BAŞLAT
               </button>
             </form>
             <NudgeButton users={allTeam} />
           </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-16">
        {view === 'calendar' ? (
           <RehearsalCalendar rehearsals={allRehearsals} />
        ) : (
          <>
            {/* CANLI YOKLAMA BÖLÜMÜ (Halıhazırda Aktifse) */}
            {activeRehearsals.length > 0 && (
              <section className="animate-pulse-slow">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-red-500 text-2xl font-bold serif-font flex items-center gap-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                    Canlı Yoklama / Nabız Açık!
                  </h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-red-500/20 to-transparent"></div>
                </div>
                <div className="space-y-8">
                  {activeRehearsals.map(r => renderRehearsalCard(r, true))}
                </div>
              </section>
            )}

            {/* YENİ PROVA EKLEME FORMU */}
            {canManage && (
              <section className="glass-card border-dashed border-[var(--primary-gold)]/30">
                <h2 className="text-[var(--primary-gold)] text-xl mb-8 flex items-center gap-3 font-bold uppercase tracking-widest text-sm">
                  <ion-icon name="add-circle-outline" style={{ fontSize: '1.5rem' }}></ion-icon> 
                  Yeni Prova Takvimi Oluştur
                </h2>
                <form action={addRehearsal as any} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase ml-2">PROVA KONUSU / OYUN</label>
                    <input 
                      type="text" 
                      name="title" 
                      list="presetTitles"
                      placeholder="Örn: Hamlet 1. Perde" 
                      className="p-4 rounded-2xl bg-black/50 text-white border border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" 
                      required 
                    />
                    <datalist id="presetTitles">
                      {presetTitles.map((t: any) => <option key={t as string} value={t as string} />)}
                    </datalist>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase ml-2">MEKAN / SAHNE</label>
                    <input 
                      type="text" 
                      name="location" 
                      list="presetLocations"
                      placeholder="Örn: Haliç Yerleşkesi" 
                      className="p-4 rounded-2xl bg-black/50 text-white border border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" 
                      required 
                    />
                    <datalist id="presetLocations">
                      {presetLocations.map((l: any) => <option key={l as string} value={l as string} />)}
                    </datalist>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-5 md:col-span-2">
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-2">TARİH</label>
                      <input type="date" name="rehearsalDate" className="w-full p-4 rounded-2xl bg-black/50 text-white border border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" required />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-2">SAAT</label>
                      <input 
                        type="time" 
                        name="rehearsalTime" 
                        list="presetTimes"
                        className="w-full p-4 rounded-2xl bg-black/50 text-white border border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" 
                        required 
                      />
                      <datalist id="presetTimes">
                        {presetTimes.map((t: any) => <option key={t as string} value={t as string} />)}
                      </datalist>
                    </div>
                  </div>

                  <textarea name="notes" placeholder="Yönetmen Notu (Opsiyonel)" className="md:col-span-2 p-4 rounded-2xl bg-black/50 text-white border border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none min-h-[100px]" />
                  
                  <div className="md:col-span-2 flex items-center gap-3 px-2">
                    <input type="checkbox" name="saveAsPreset" id="saveAsPreset" className="accent-[var(--primary-gold)]" />
                    <label htmlFor="saveAsPreset" className="text-xs text-white/60 cursor-pointer hover:text-white transition-colors">Bu bilgileri şablon (preset) olarak kaydet</label>
                  </div>

                  <button type="submit" className="md:col-span-2 btn btn-primary py-4 font-bold tracking-widest uppercase text-xs shadow-glow mt-2">
                    TAKVİME MÜHÜRLE
                  </button>
                </form>
              </section>
            )}

            {/* GELECEK PROVA TAKVİM */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-white text-2xl font-bold serif-font underline decoration-[var(--primary-gold)] underline-offset-8">Gelecek Prova Takvimi</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
              
              {upcomingRehearsals.length === 0 ? (
                <div className="p-10 text-center glass-card border-white/5">
                    <p className="text-[var(--text-muted)] italic text-sm">Şu an için aktif bir kayıt bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {upcomingRehearsals.map(r => renderRehearsalCard(r, true))}
                </div>
              )}
            </section>

            {/* GEÇMİŞ PROVA LOGLARI (ARŞİV) */}
            {canManage && (
              <section className="mt-20 pt-20 border-t border-white/10">
                <div className="flex items-center gap-4 mb-10">
                   <h2 className="text-white/30 text-xl font-bold serif-font uppercase tracking-widest">Geçmiş Prova Logları (Arşiv)</h2>
                   <div className="h-[1px] flex-1 bg-white/5"></div>
                   <span className="text-[10px] text-white/20 font-black">{pastRehearsals.length} KAYIT</span>
                </div>
                <div className="space-y-8 opacity-60 hover:opacity-100 transition-opacity">
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
