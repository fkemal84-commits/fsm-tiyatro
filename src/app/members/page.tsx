import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { addRehearsal, addTeamNeed } from "@/app/actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Üye Panosu",
  description: "FSM Tiyatro üyelerine özel prova takvimi ve ekip duyuruları.",
};

export default async function MembersDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const canAdd = role === 'ADMIN' || role === 'SUPERADMIN';

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
  const rehearsals = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const teamNeedsSnapshot = await adminDb.collection('teamNeeds').where('isActive', '==', true).get();
  const teamNeeds = teamNeedsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-16">
        <h1 className="serif-font text-5xl text-[var(--primary-gold)] mb-4">Üye Panosu</h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
          {session ? (
            <>Hoş geldin, <span className="text-white font-bold">{session.user?.name || session.user?.email}</span>!</>
          ) : (
            <>FSM Vakıf Üniversitesi Sinema ve Tiyatro Kulübü <span className="text-white font-bold">Dijital Panosu</span></>
          )}
          <br/> 
          Sadece üyelere özel prova saatleri ve ekip ihtiyaçları aşağıdadır.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        
        {/* PROVALAR KARTI */}
        <div className="glass-card">
          <h2 className="text-white text-2xl mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
            🎭 Yaklaşan Provalar
          </h2>
          
          {canAdd && (
            <form action={addRehearsal} className="mb-6 bg-white/5 p-6 rounded-xl flex flex-col gap-3 border border-dashed border-[var(--primary-gold)]">
              <h4 className="text-[var(--primary-gold)] text-sm font-semibold">+ Yeni Prova Ekle (Yönetici)</h4>
              <input type="text" name="title" placeholder="Prova Konusu" className="p-3 rounded-lg bg-black/50 text-white border-none focus:ring-1 focus:ring-[var(--primary-gold)]" required />
              <input type="text" name="date" placeholder="Tarih & Saat" className="p-3 rounded-lg bg-black/50 text-white border-none focus:ring-1 focus:ring-[var(--primary-gold)]" required />
              <input type="text" name="location" placeholder="Konum" className="p-3 rounded-lg bg-black/50 text-white border-none focus:ring-1 focus:ring-[var(--primary-gold)]" required />
              <input type="text" name="notes" placeholder="Ek Notlar (Opsiyonel)" className="p-3 rounded-lg bg-black/50 text-white border-none focus:ring-1 focus:ring-[var(--primary-gold)]" />
              <button type="submit" className="btn btn-outline border-[var(--primary-gold)] text-[var(--primary-gold)] hover:bg-[var(--primary-gold)] hover:text-black mt-2">
                Üyelere Yayınla
              </button>
            </form>
          )}

          {rehearsals.length === 0 ? (
            <p className="text-[var(--text-muted)]">Henüz planlanmış bir prova takvimi girilmemiş.</p>
          ) : (
            <ul className="space-y-4">
              {rehearsals.map((r: any) => (
                <li key={r.id} className="p-4 bg-black/30 rounded-lg border border-white/5 hover:border-[var(--primary-gold-dim)] transition-all">
                  <h4 className="text-[var(--primary-gold)] font-bold text-lg mb-1">📌 {r.title}</h4>
                  <div className="text-sm text-white/90">⏰ {r.date}</div>
                  <div className="text-sm text-white/90 mb-2">📍 {r.location}</div>
                  {r.notes && <p className="text-xs text-[var(--text-muted)] italic bg-white/5 p-2 rounded">Not: {r.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* EKİP İHTİYAÇLARI */}
        <div className="glass-card">
          <h2 className="text-white text-2xl mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
            🤝 Ekip İhtiyaç İlanları
          </h2>

          {canAdd && (
             <form action={addTeamNeed} className="mb-6 bg-white/5 p-6 rounded-xl flex flex-col gap-3 border border-dashed border-[var(--primary-gold)]">
              <h4 className="text-[var(--primary-gold)] text-sm font-semibold">+ Yeni Personel Açığı Ekle (Yönetici)</h4>
              <input type="text" name="roleName" placeholder="Aranan Yetenek" className="p-3 rounded-lg bg-black/50 text-white border-none focus:ring-1 focus:ring-[var(--primary-gold)]" required />
              <textarea name="description" placeholder="Beklentilerimiz..." rows={3} className="p-3 rounded-lg bg-black/50 text-white border-none focus:ring-1 focus:ring-[var(--primary-gold)]" required></textarea>
              <button type="submit" className="btn btn-outline border-[var(--primary-gold)] text-[var(--primary-gold)] hover:bg-[var(--primary-gold)] hover:text-black mt-2">
                İlanı Yayınla
              </button>
            </form>
          )}

          {teamNeeds.length === 0 ? (
            <p className="text-[var(--text-muted)]">Şu an için açık bir ekip personel ilanı yok.</p>
          ) : (
            <ul className="space-y-4">
              {teamNeeds.map((t: any) => (
                <li key={t.id} className="p-5 bg-[var(--accent-red-dim)] border border-[var(--primary-gold-dim)] rounded-xl hover:bg-[var(--accent-red)]/30 transition-all">
                  <h4 className="text-white font-bold text-xl mb-2">🎯 {t.roleName} Aranıyor!</h4>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{t.description}</p>
                  <button className="btn btn-outline w-full text-xs py-2">Ekibe Katılmak İçin Başvur</button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
