import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { addRehearsal, deleteRehearsal, getWhatsAppRehearsalLink } from "@/app/actions";
import DeleteButton from "@/components/DeleteButton";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Özel Prova Takvimi",
  description: "Oyuncu ve yöneticilere özel detaylı prova takvimi.",
};

export default async function RehearsalsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Sadece Admin, Oyuncu ve Yönetmenler girebilir
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'PLAYER'];
  if (!allowedRoles.includes(role)) {
    redirect('/members');
  }

  const canManage = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(role);

  const rehearsalsSnapshot = await adminDb.collection('rehearsals').get();
  const rehearsals = rehearsalsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-16">
        <h1 className="serif-font text-5xl text-[var(--primary-gold)] mb-4">🎭 Özel Prova Takvimi</h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
          Bu alan sadece <span className="text-[var(--primary-gold)] font-bold">Yöneticiler</span> ve <span className="text-white font-bold">Oyuncular</span> içindir. 
          Lütfen prova saatlerine sadık kalalım.
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        {canManage && (
          <div className="glass-card mb-12 border-dashed border-[var(--primary-gold)]">
            <h2 className="text-[var(--primary-gold)] text-xl mb-6 flex items-center gap-2 font-bold">
              <ion-icon name="add-circle-outline"></ion-icon> Yeni Prova Takvimi Ekle
            </h2>
            <form action={addRehearsal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="title" placeholder="Prova Konusu / Sahne No" className="p-3 rounded-lg bg-black/50 text-white border-white/10 focus:ring-1 focus:ring-[var(--primary-gold)]" required />
              <input type="text" name="date" placeholder="Tarih & Saat" className="p-3 rounded-lg bg-black/50 text-white border-white/10 focus:ring-1 focus:ring-[var(--primary-gold)]" required />
              <input type="text" name="location" placeholder="Konum / Sahne" className="p-3 rounded-lg bg-black/50 text-white border-white/10 focus:ring-1 focus:ring-[var(--primary-gold)]" required />
              <input type="text" name="notes" placeholder="Yönetmen Notu (Opsiyonel)" className="p-3 rounded-lg bg-black/50 text-white border-white/10 focus:ring-1 focus:ring-[var(--primary-gold)]" />
              <button type="submit" className="md:col-span-2 btn btn-primary py-3 font-bold tracking-widest uppercase text-xs">
                Takvime İşle
              </button>
            </form>
          </div>
        )}

        <div className="glass-card">
          <h2 className="text-white text-2xl mb-8 border-b border-white/10 pb-4">📌 Güncel Prova Listesi</h2>
          
          {rehearsals.length === 0 ? (
            <p className="text-[var(--text-muted)] italic">Şu an için planlanmış bir prova bulunmuyor.</p>
          ) : (
            <div className="space-y-6">
              {rehearsals.map((r: any) => (
                <div key={r.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-[var(--primary-gold)] transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[var(--primary-gold)] text-xl font-bold">{r.title}</h3>
                      <p className="text-white/60 text-sm mt-1">Eklenme: {new Date(r.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="bg-[var(--primary-gold)] text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        PROVA
                      </div>
                      {canManage && (
                        <>
                          <a 
                            href={getWhatsAppRehearsalLink(r)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#25D366] text-white p-2 rounded-lg flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                            title="WhatsApp grubunda duyur"
                          >
                            <ion-icon name="logo-whatsapp" style={{ fontSize: '1.2rem' }}></ion-icon>
                          </a>
                          <DeleteButton 
                            action={deleteRehearsal} 
                            id={r.id} 
                            name={r.title} 
                            confirmMessage="Bu provayı takvimden silmek istediğine emin misin?" 
                            idFieldName="rehearsalId"
                          />
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 text-white/90">
                      <ion-icon name="calendar-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
                      <span>{r.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                      <ion-icon name="location-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
                      <span>{r.location}</span>
                    </div>
                  </div>

                  {r.notes && (
                    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold text-[var(--primary-gold)] uppercase mb-2">Yönetmen Notu:</h4>
                      <p className="text-[var(--text-muted)] text-sm italic">{r.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
