import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { addRehearsal, deleteRehearsal, startInstantAttendance } from "@/app/actions";
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

export default async function RehearsalsPage(props: { searchParams: Promise<{ view?: string }> }) {
  const searchParams = await props.searchParams;
  const view = searchParams.view || 'list';
  
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Sadece Admin, Aktör ve Yönetmenler girebilir
  // AKTOR veya MEMBER (normal üye girişi yapan oyuncular) erişebilir
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'AKTOR', 'MEMBER'];
  if (!allowedRoles.includes(role)) {
    redirect('/members');
  }

  // Yönetim yetkisi sadece Admin Mode açıksa ve rölü uygunsa geçerli olsun
  const canManage = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(role) && (session?.user as any)?.isAdminMode;

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
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
      // Format: "YYYY-MM-DD - Saat: HH:MM"
      // Sadece ana tarihi çek: "YYYY-MM-DD"
      const datePart = dateStr.split(' - ')[0]; 
      const [year, month, day] = datePart.split('-').map(Number);
      // Yerel saat uyuşmazlıklarını önlemek için normalize et
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

  const renderRehearsalCard = (r: any) => {
    const isInstant = r.date?.includes('(Anlık)');
    
    return (
      <div key={r.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-[var(--primary-gold)]/50 transition-all group relative overflow-hidden">
        {isInstant && (
          <div className="absolute top-0 right-10 bg-[var(--primary-gold)] text-black text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">
            ANLIK YOKLAMA LOGU
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <ion-icon name={isInstant ? "flash" : "calendar"} style={{ color: 'var(--primary-gold)', fontSize: '1rem' }}></ion-icon>
               <h3 className="text-white text-xl font-bold tracking-tight">{r.title}</h3>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[var(--primary-gold)] text-[10px] font-mono bg-[var(--primary-gold)]/10 px-2 py-0.5 rounded border border-[var(--primary-gold)]/20">
                 {new Date(r.createdAt).toLocaleDateString('tr-TR')} | {new Date(r.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
               </span>
               <span className="text-white/30 text-[10px] uppercase tracking-widest">ID: {r.id.slice(-4)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canManage && (
              <>
                {!isInstant && (
                  <a 
                    href={getWhatsAppRehearsalLink(r)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#25D366]/10 text-[#25D366] rounded-xl flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20"
                    title="WhatsApp Duyurusu"
                  >
                    <ion-icon name="logo-whatsapp" style={{ fontSize: '1.2rem' }}></ion-icon>
                  </a>
                )}
                <DeleteButton 
                  action={deleteRehearsal as any} 
                  id={r.id} 
                  name={r.title} 
                  confirmMessage="Bu yoklama kaydını sonsuza dek silmek istediğine emin misin?" 
                  idFieldName="rehearsalId"
                />
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-white/80 bg-white/5 p-3 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
            <ion-icon name="navigate-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">PLANLANAN ZAMAN/TARİH</span>
              <span className="text-xs font-semibold">{r.date || 'Belirtilmedi'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/80 bg-white/5 p-3 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
            <ion-icon name="location-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">MEKAN / SAHNE</span>
              <span className="text-xs font-semibold">{r.location || 'Sahne'}</span>
            </div>
          </div>
        </div>
  
        {r.notes && (
          <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/5 border-l-2 border-l-[var(--primary-gold)]/50">
            <h4 className="text-[10px] font-bold text-[var(--primary-gold)] uppercase mb-2 tracking-widest opacity-70">Plan Notları:</h4>
            <p className="text-white/60 text-xs italic leading-relaxed">{r.notes}</p>
          </div>
        )}
  
        {canManage && (
          <div className="pt-4 border-t border-white/10">
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
                  {activeRehearsals.map(renderRehearsalCard)}
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

            {/* GELECEK PROVALAR & GÜNCEL LOGLAR */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-white text-2xl font-bold serif-font">Güncel Provalar & Loglar</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
              
              {upcomingRehearsals.length === 0 ? (
                <div className="p-10 text-center glass-card border-white/5">
                    <p className="text-[var(--text-muted)] italic text-sm">Şu an için aktif bir kayıt bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {upcomingRehearsals.map(renderRehearsalCard)}
                </div>
              )}
            </section>

            {/* GEÇMİŞ ARŞİV - Sadece Yönetici Modu'ndaki yetkililer görebilir */}
            {canManage && (
              <ArchiveWrapper count={pastRehearsals.length}>
                {pastRehearsals.map(renderRehearsalCard)}
              </ArchiveWrapper>
            )}
          </>
        )}
      </div>
    </div>
  );
}
