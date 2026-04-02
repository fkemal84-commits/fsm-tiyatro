import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import AttendanceManager from "@/components/AttendanceManager";
import { startInstantAttendance } from "@/app/actions";
import Link from "next/link";

export default async function AttendanceDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAdminMode = (session?.user as any)?.isAdminMode;

  // Sadece YÖNETİM görebilir
  const canManage = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(role) && isAdminMode;
  if (!canManage) redirect('/members');

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
  const allRehearsals = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const activePulse = allRehearsals.filter(r => r.pulseActive === true);
  const recentRehearsals = allRehearsals.filter(r => !r.pulseActive).slice(0, 10);

  const usersSnap = await adminDb.collection('users').get();
  const allTeam = usersSnap.docs
    .map(doc => ({ id: doc.id, name: doc.data().name, surname: doc.data().surname, role: doc.data().role }))
    .filter(u => u.name && u.role !== 'USER')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="max-w-4xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="serif-font text-5xl text-white mb-2">Yoklama <span className="text-[var(--primary-gold)]">Paneli</span></h1>
            <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold italic">Sadece Yetkili Personel & Reji Erişimi</p>
          </div>
          <form action={startInstantAttendance as any}>
             <button type="submit" className="btn btn-primary px-8 py-4 text-xs font-black tracking-widest shadow-glow flex items-center gap-3">
               <ion-icon name="flashlight" style={{ fontSize: '1.2rem' }}></ion-icon>
               ANLIK NABIZ BAŞLAT
             </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* CANLI NABIZLAR */}
        {activePulse.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
               <h2 className="text-white text-xl font-bold uppercase tracking-widest">Açık Nabız Yoklamaları</h2>
            </div>
            <div className="space-y-6">
              {activePulse.map(r => (
                <div key={r.id} className="glass-card border-red-500/30 bg-red-500/[0.02]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-lg">{r.title}</h3>
                    <span className="text-red-500 text-[10px] font-black uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 tracking-tighter animate-pulse text-sm">CANLI</span>
                  </div>
                  <AttendanceManager 
                    rehearsalId={r.id} 
                    allUsers={allTeam} 
                    initialAttendance={r.attendance || {}} 
                    initialNotes={r.attendanceNotes}
                    pulseResponses={r.pulseResponses || []}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GEÇMİŞ / TAMAMLANACAK YOKLAMALAR */}
        <section>
           <h2 className="text-white/40 text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
             <ion-icon name="time-outline"></ion-icon> Son Prova Kayıtları
           </h2>
           <div className="space-y-6">
              {recentRehearsals.map(r => (
                <div key={r.id} className="glass-card border-white/5 hover:border-white/10 transition-all opacity-80 hover:opacity-100">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-white font-bold text-lg leading-none mb-2">{r.title}</h3>
                      <p className="text-[10px] text-white/30 uppercase font-mono">{r.date || 'Tarih Belirsiz'}</p>
                    </div>
                    <div className="text-[10px] font-bold text-[var(--primary-gold)] uppercase tracking-widest bg-[var(--primary-gold)]/5 px-3 py-1.5 rounded-xl border border-[var(--primary-gold)]/10">
                       PROVA LOGU
                    </div>
                  </div>
                  <AttendanceManager 
                    rehearsalId={r.id} 
                    allUsers={allTeam} 
                    initialAttendance={r.attendance || {}} 
                    initialNotes={r.attendanceNotes}
                    pulseResponses={r.pulseResponses || []}
                  />
                </div>
              ))}
           </div>
        </section>

        <div className="pt-10 text-center border-t border-white/5">
           <Link href="/members/rehearsals" className="text-white/20 hover:text-[var(--primary-gold)] text-[10px] font-bold uppercase tracking-widest transition-all">
             ← PROVA TAKVİMİNE GERİ DÖN
           </Link>
        </div>
      </div>
    </div>
  );
}
