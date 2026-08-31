import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import AttendanceManager from "@/components/AttendanceManager";
import AttendanceQRScanner from "@/components/AttendanceQRScanner";
import AttendanceSessionLive from "@/components/AttendanceSessionLive";
import { openAttendanceSession, createEvent } from "@/app/actions";
import { isDirector, isAdmin, isActiveMember } from "@/lib/auth-helpers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AttendanceDashboard({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const resolvedParams = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = session.user as any;
  const canManage = isAdmin(user) || isDirector(user);
  const isMember = isActiveMember(user);

  if (!isMember && !canManage) redirect('/');

  // Aktif açık QR Yoklama Oturumlarını getir
  const now = Date.now();
  const sessionsSnap = await adminDb.collection('attendance_sessions')
    .where('status', '==', 'OPEN')
    .get();

  const activeSessions = sessionsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .filter(s => s.expiresAt > now);

  // Etkinlikleri ve Provaları getir
  const eventsSnap = await adminDb.collection('events').orderBy('createdAt', 'desc').limit(20).get();
  const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  const usersSnap = await adminDb.collection('users').get();
  const allTeam = usersSnap.docs
    .map(doc => {
      const d = doc.data();
      const rawName = d.name || '';
      const rawSurname = d.surname || '';
      const cleanFirst = rawName.replace(/undefined/gi, '').trim();
      const cleanLast = rawSurname.replace(/undefined/gi, '').trim();
      return { id: doc.id, name: cleanFirst, surname: cleanLast, role: d.role, email: d.email };
    })
    .filter(u => u.name && u.role !== 'USER')
    .sort((a, b) => a.name.localeCompare(b.name));

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
  const allRehearsals = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const recentRehearsals = allRehearsals.slice(0, 10);

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="max-w-4xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--border-subtle)] pb-8">
          <div>
            <h1 className="serif-font text-4xl sm:text-5xl text-[var(--text-main)] mb-2">Yoklama <span className="text-[var(--primary-gold)]">Paneli</span></h1>
            <p className="text-[var(--text-dim)] uppercase tracking-widest text-[11px] font-bold">
              {canManage ? 'Yetkili & Reji Canlı QR Yoklama Yönetimi' : 'Fiziksel QR Katılım Doğrulama Alanı'}
            </p>
          </div>

          {canManage && events.length > 0 && (
            <form action={async (formData: FormData) => {
              'use server';
              const eventId = formData.get('eventId') as string;
              if (eventId) {
                await openAttendanceSession(eventId, 10);
              }
            }} className="flex items-center gap-2 flex-wrap">
              <select
                name="eventId"
                required
                className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              >
                <option value="">Yoklama Açılacak Etkinlik Seç...</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary px-5 py-2.5 text-xs font-bold tracking-wider flex items-center gap-2">
                <ion-icon name="qr-code-outline" style={{ fontSize: '1.1rem' }}></ion-icon>
                <span>Canlı QR Başlat</span>
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-10">
        {/* AKTİF QR YOKLAMA OTURUMLARI (Canlı QR Ekranı) */}
        {activeSessions.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
              <h2 className="text-emerald-400 text-xl font-bold uppercase tracking-wider">Açık Canlı QR Oturumları</h2>
            </div>
            {activeSessions.map(s => {
              const ev = events.find(e => e.id === s.eventId);
              return (
                <AttendanceSessionLive 
                  key={s.id}
                  session={s}
                  event={ev || { title: s.eventTitle }}
                  participants={allTeam}
                  canManage={canManage}
                />
              );
            })}
          </section>
        )}

        {/* FİZİKSEL QR TARAYICI (KATILIMCILAR İÇİN) */}
        <section>
          <AttendanceQRScanner />
        </section>

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
