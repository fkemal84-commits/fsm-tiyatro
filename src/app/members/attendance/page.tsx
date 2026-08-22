import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import AttendanceManager from "@/components/AttendanceManager";
import { startInstantAttendance } from "@/app/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="max-w-4xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
          <div>
            <h1 className="serif-font text-4xl sm:text-5xl text-[var(--text-main)] mb-2">Yoklama <span className="text-[var(--primary-gold)]">Paneli</span></h1>
            <p className="text-[var(--text-dim)] uppercase tracking-widest text-[11px] font-bold">Yetkili & Reji Yönetim Alanı</p>
          </div>
          <form action={startInstantAttendance as any}>
             <button type="submit" className="btn btn-primary px-6 py-3 text-xs font-bold tracking-wider flex items-center gap-2">
               <ion-icon name="flashlight" style={{ fontSize: '1.1rem' }}></ion-icon>
               Anlık Yoklama Başlat
             </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-10">
        {/* CANLI NABIZLAR */}
        {activePulse.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
               <h2 className="text-red-500 text-xl font-bold uppercase tracking-wider">Açık Nabız Yoklamaları</h2>
            </div>
            <div className="space-y-6">
              {activePulse.map(r => (
                <div key={r.id} className="glass-card border-red-500/30 bg-[var(--bg-surface)]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[var(--text-main)] font-bold text-lg">{r.title}</h3>
                    <span className="text-red-500 text-xs font-bold uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 animate-pulse">CANLI</span>
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
           <h2 className="text-[var(--text-dim)] text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
             <ion-icon name="time-outline"></ion-icon> Son Prova Kayıtları
           </h2>
           <div className="space-y-6">
              {recentRehearsals.map(r => (
                <div key={r.id} className="glass-card bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)] transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-[var(--text-main)] font-bold text-lg leading-none mb-1.5">{r.title}</h3>
                      <p className="text-xs text-[var(--text-dim)] font-mono">{r.date || 'Tarih Belirsiz'}</p>
                    </div>
                    <div className="text-[10px] font-bold text-[var(--primary-gold)] uppercase tracking-wider bg-[var(--primary-gold-dim)] px-3 py-1 rounded-lg border border-[var(--primary-gold-border)]">
                       PROVA KAYDI
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

        <div className="pt-8 text-center border-t border-[var(--border-subtle)]">
           <Link href="/members/rehearsals" className="text-[var(--text-dim)] hover:text-[var(--primary-gold)] text-xs font-bold uppercase tracking-wider transition-all">
             ← Prova Takvimine Geri Dön
           </Link>
        </div>
      </div>
    </div>
  );
}
