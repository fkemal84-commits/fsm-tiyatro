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

export const metadata: Metadata = {
  title: "Özel Prova Takvimi",
  description: "Oyuncu ve yöneticilere özel detaylı prova takvimi.",
};

export default async function RehearsalsPage() {
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
    try {
      // "2024-03-29" formatını parse etmeye çalış
      return new Date(dateStr).getTime();
    } catch {
      return 0;
    }
  };

  const upcomingRehearsals = allRehearsals.filter(r => parseRehearsalDate(r.date) >= today);
  const pastRehearsals = allRehearsals.filter(r => parseRehearsalDate(r.date) < today);

  // Yoklama için kullanıcıları çek
  const usersSnap = await adminDb.collection('users').get();
  const allTeam = usersSnap.docs
    .map(doc => ({ id: doc.id, name: doc.data().name, surname: doc.data().surname, role: doc.data().role }))
    .filter(u => u.name && u.role !== 'USER')
    .sort((a, b) => a.name.localeCompare(b.name));

  const renderRehearsalCard = (r: any) => (
    <div key={r.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-[var(--primary-gold)]/50 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[var(--primary-gold)] text-xl font-bold group-hover:text-white transition-colors">{r.title}</h3>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-widest">
            Kayıt: {new Date(r.createdAt).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {canManage && (
            <>
              <a 
                href={getWhatsAppRehearsalLink(r)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#25D366]/20 text-[#25D366] p-2 rounded-xl flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                title="WhatsApp Duyurusu"
              >
                <ion-icon name="logo-whatsapp" style={{ fontSize: '1.2rem' }}></ion-icon>
              </a>
              <DeleteButton 
                action={deleteRehearsal as any} 
                id={r.id} 
                name={r.title} 
                confirmMessage="Bu provayı arşivden tamamen silmek istediğine emin misin?" 
                idFieldName="rehearsalId"
              />
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 text-white/90 bg-white/5 p-3 rounded-2xl border border-white/5">
          <ion-icon name="calendar-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
          <span className="text-xs font-medium">{r.date || 'Tarih Belirtilmedi'}</span>
        </div>
        <div className="flex items-center gap-3 text-white/90 bg-white/5 p-3 rounded-2xl border border-white/5">
          <ion-icon name="location-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
          <span className="text-xs font-medium">{r.location || 'Konum Belirtilmedi'}</span>
        </div>
      </div>

      {r.notes && (
        <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/5 border-l-2 border-l-[var(--primary-gold)]">
          <h4 className="text-[10px] font-bold text-[var(--primary-gold)] uppercase mb-2 tracking-widest">Yönetmen Notu (Planlanan):</h4>
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
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-16">
        <div className="flex justify-between items-center mb-10 flex-wrap gap-6">
          <div className="text-left">
            <h1 className="serif-font text-5xl text-white mb-2">Prova <span className="text-[var(--primary-gold)]">Takvimi</span></h1>
            <p className="text-white/60">Disiplin, sahnenin ruhudur.</p>
          </div>
          {canManage && (
             <div className="flex flex-col sm:flex-row gap-3">
             <form action={startInstantAttendance as any}>
               <button type="submit" className="btn btn-outline border-[var(--primary-gold)] text-[var(--primary-gold)] flex items-center gap-2 hover:bg-[var(--primary-gold)] hover:text-black py-2 px-6 rounded-full text-xs font-bold transition-all whitespace-nowrap">
                 <ion-icon name="flashlight-outline"></ion-icon>
                 HIZLI YOKLAMA BAŞLAT
               </button>
             </form>
             <NudgeButton />
           </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-16">
        {/* YENİ PROVA EKLEME FORMU */}
        {canManage && (
          <section className="glass-card border-dashed border-[var(--primary-gold)]/30">
            <h2 className="text-[var(--primary-gold)] text-xl mb-8 flex items-center gap-3 font-bold uppercase tracking-widest text-sm">
              <ion-icon name="add-circle-outline" style={{ fontSize: '1.5rem' }}></ion-icon> 
              Yeni Prova Takvimi Oluştur
            </h2>
            <form action={addRehearsal as any} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input type="text" name="title" placeholder="Prova Konusu / Sahne No" className="p-4 rounded-2xl bg-black/50 text-white border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" required />
              <input type="text" name="location" placeholder="Konum / Sahne" className="p-4 rounded-2xl bg-black/50 text-white border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" required />
              
              <div className="flex flex-col md:flex-row gap-5 md:col-span-2">
                <input type="date" name="rehearsalDate" className="flex-1 p-4 rounded-2xl bg-black/50 text-white border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" required />
                <input type="time" name="rehearsalTime" className="flex-1 p-4 rounded-2xl bg-black/50 text-white border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none" required />
              </div>

              <textarea name="notes" placeholder="Yönetmen Notu (Opsiyonel)" className="md:col-span-2 p-4 rounded-2xl bg-black/50 text-white border-white/10 focus:border-[var(--primary-gold)] transition-all outline-none min-h-[100px]" />
              
              <button type="submit" className="md:col-span-2 btn btn-primary py-4 font-bold tracking-widest uppercase text-xs shadow-glow">
                TAKVİME MÜHÜRLE
              </button>
            </form>
          </section>
        )}

        {/* GELECEK PROVALAR */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-white text-2xl font-bold serif-font">Gelecek Provalar</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>
          
          {upcomingRehearsals.length === 0 ? (
            <div className="p-10 text-center glass-card border-white/5">
                <p className="text-[var(--text-muted)] italic">Şu an için planlanmış bir prova bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {upcomingRehearsals.map(renderRehearsalCard)}
            </div>
          )}
        </section>

        {/* GEÇMİŞ PROVALAR & ARŞİV */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-white/60 text-2xl font-bold serif-font">Geçmiş Provalar & Arşiv</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>
          
          {pastRehearsals.length === 0 ? (
            <p className="text-white/20 text-center italic text-sm">Henüz bir arşiv kaydı bulunmuyor.</p>
          ) : (
            <div className="space-y-8 opacity-70 hover:opacity-100 transition-opacity">
              {pastRehearsals.map(renderRehearsalCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
