import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ekip Rehberimiz | FSM Tiyatro",
  description: "FSM Tiyatro kulübünün yetenekli aktörleri ve teknik ekibi.",
};

export default async function TeamDirectory() {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="pt-40 text-center text-white">Bu alanı görmek için giriş yapmalısınız.</div>;

  const usersSnap = await adminDb.collection('users').get();
  const members = usersSnap.docs
    .map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        name: data.name, 
        surname: data.surname, 
        email: data.email, 
        role: data.role, 
        photoUrl: data.photoUrl || '', 
        bio: data.bio || '', 
        skills: data.skills || '', 
        phone: data.phone || '' 
      };
    })
    .filter(u => u.role !== 'USER' && u.name) // Sadece profili olanları göster
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-16">
        <h1 className="serif-font text-5xl text-white mb-4">Ekip <span className="text-[var(--primary-gold)]">Rehberimiz</span></h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto italic">
          "Sahne, her birimizin bir araya gelerek oluşturduğu muazzam bir tablodur."
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {members.map((m) => (
          <div key={m.id} className="glass-card group hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center p-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--primary-gold-dim)] group-hover:border-[var(--primary-gold)] transition-all mb-6">
              <img 
                src={m.photoUrl || "/default-avatar.svg"} 
                alt={m.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <h3 className="text-white text-xl font-bold mb-1">{m.name} {m.surname}</h3>
            <div className="text-[var(--primary-gold)] text-[10px] font-bold uppercase tracking-widest mb-4 bg-white/5 py-1 px-3 rounded-full">
              {m.role === 'AKTOR' ? 'AKTÖR 🎭' : 
               m.role === 'DIRECTOR' ? 'YÖNETMEN 🎬' : 
               m.role === 'ASST_DIRECTOR' ? 'YRD. YÖNETMEN' : 
               m.role === 'ADMIN' ? 'YÖNETİCİ 👑' : 
               m.role === 'SUPERADMIN' ? 'GENEL YÖNETİCİ' : 
               m.role === 'EDITOR' ? 'İÇERİK EDİTÖRÜ' : 'ÜYE'}
            </div>

            {m.bio && (
              <p className="text-[var(--text-muted)] text-sm mb-6 line-clamp-3 italic">"{m.bio}"</p>
            )}

            <div className="mt-auto w-full space-y-4">
              {m.skills && (
                <div className="text-left">
                  <span className="text-[var(--primary-gold)] text-[9px] font-bold uppercase block mb-1">Yetenekler:</span>
                  <p className="text-white/80 text-xs line-clamp-1">{m.skills}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-white/5 flex justify-center gap-4">
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="text-white/40 hover:text-[var(--primary-gold)] transition-colors text-xl">
                    <ion-icon name="call-outline"></ion-icon>
                  </a>
                )}
                <a href={`mailto:${m.email}`} className="text-white/40 hover:text-[var(--primary-gold)] transition-colors text-xl">
                  <ion-icon name="mail-outline"></ion-icon>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-20">
          Rehberde henüz kayıtlı üye bulunmuyor.
        </div>
      )}

      <div className="mt-20 text-center">
        <Link href="/members" className="btn btn-outline text-xs">PANELİNE GERİ DÖN</Link>
      </div>
    </div>
  );
}
