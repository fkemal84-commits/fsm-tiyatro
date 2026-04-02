import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ekip Rehberimiz | FSM Tiyatro",
  description: "FSM Tiyatro kulübünün yetenekli aktörleri ve teknik ekibi.",
};

export default async function TeamDirectory(props: { searchParams: Promise<{ play?: string }> }) {
  const searchParams = await props.searchParams;
  const playFilter = searchParams.play || 'ALL';

  const session = await getServerSession(authOptions);
  const currentUserRole = (session?.user as any)?.role;

  if (!session) return <div className="pt-40 text-center text-white">Bu alanı görmek için giriş yapmalısınız.</div>;

  // Tüm oyunlar listesini çek (Filtreleme için)
  const playsSnap = await adminDb.collection('plays').get();
  const allPlays = playsSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));

  const usersSnap = await adminDb.collection('users').get();
  let members = usersSnap.docs
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
        phone: data.phone || '',
        assignedPlays: (data.assignedPlays as string[]) || [] 
      };
    })
    .filter(u => u.role !== 'USER' && u.name) // Sadece profili olanları göster
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // 1. GİZLİLİK FİLTRESİ: Aktörler normal üyeleri (MEMBER) göremez
  if (currentUserRole === 'AKTOR') {
    members = members.filter(u => u.role !== 'MEMBER');
  }

  // 2. OYUN FİLTRESİ (Eğer seçilmişse)
  if (playFilter !== 'ALL') {
    members = members.filter(u => u.assignedPlays.includes(playFilter));
  }

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-10">
        <h1 className="serif-font text-5xl text-white mb-4">Ekip <span className="text-[var(--primary-gold)]">Rehberimiz</span></h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto italic">
          "Sahne, her birimizin bir araya gelerek oluşturduğu muazzam bir tablodur."
        </p>
      </header>

      {/* FİLTRELEME ALANI */}
      <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-center gap-6 glass-card p-6 border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-[var(--primary-gold)]/10 text-[var(--primary-gold)] flex items-center justify-center text-2xl border border-[var(--primary-gold)]/20 shadow-lg shadow-[var(--primary-gold)]/5">
             <ion-icon name="filter-outline"></ion-icon>
           </div>
           <div>
             <h4 className="text-white text-sm font-bold uppercase tracking-widest leading-none">Kadroları Süz</h4>
             <p className="text-[10px] text-white/30 uppercase mt-1 tracking-tighter">Oyun bazlı oyuncu listesi</p>
           </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
           <Link 
             href="/members/team?play=ALL"
             className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
               playFilter === 'ALL' 
                ? 'bg-[var(--primary-gold)] text-black border-[var(--primary-gold)] shadow-lg shadow-[var(--primary-gold)]/20' 
                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
             }`}
           >
             TÜM EKİP
           </Link>
           {allPlays.map(p => (
             <Link 
                key={p.id}
                href={`/members/team?play=${p.id}`}
                className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  playFilter === p.id 
                    ? 'bg-[var(--primary-gold)] text-black border-[var(--primary-gold)] shadow-lg shadow-[var(--primary-gold)]/20' 
                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                }`}
             >
                {p.title}
             </Link>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {members.map((m) => (
          <div key={m.id} className="glass-card group hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center p-8 relative overflow-hidden">
            {/* Arka plan süsü */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--primary-gold)]/5 rounded-bl-[4rem] group-hover:bg-[var(--primary-gold)]/10 transition-all"></div>
            
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--primary-gold-dim)] group-hover:border-[var(--primary-gold)] transition-all mb-6 relative z-10 shadow-xl shadow-black/20">
              <img 
                src={m.photoUrl || "/default-avatar.svg"} 
                alt={m.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <h3 className="text-white text-xl font-bold mb-1 relative z-10 tracking-tight">{m.name} {m.surname}</h3>
            <div className="text-[var(--primary-gold)] text-[10px] font-bold uppercase tracking-widest mb-4 bg-white/5 py-1 px-3 rounded-full relative z-10 border border-[var(--primary-gold)]/20">
              {m.role === 'AKTOR' || m.role === 'PLAYER' ? 'AKTÖR 🎭' : 
               m.role === 'DIRECTOR' ? 'YÖNETMEN 🎬' : 
               m.role === 'ASST_DIRECTOR' ? 'YRD. YÖNETMEN' : 
               m.role === 'ADMIN' ? 'YÖNETİCİ 👑' : 
               m.role === 'SUPERADMIN' ? 'GENEL YÖNETİCİ' : 
               m.role === 'EDITOR' ? 'İÇERİK EDİTÖRÜ' : 'ÜYE'}
            </div>

            {m.bio && (
              <p className="text-white/40 text-xs mb-6 line-clamp-3 italic opacity-80 leading-relaxed font-light">"{m.bio}"</p>
            )}

            <div className="mt-auto w-full space-y-4 relative z-10">
              {m.skills && (
                <div className="text-left bg-black/20 p-3 rounded-xl border border-white/5 group-hover:border-[var(--primary-gold)]/20 transition-all">
                  <span className="text-[var(--primary-gold)] text-[9px] font-bold uppercase block mb-1 tracking-widest opacity-60">Öne Çıkanlar:</span>
                  <p className="text-white/80 text-[11px] line-clamp-1">{m.skills}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-white/5 flex justify-center gap-4">
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-[var(--primary-gold)] hover:bg-[var(--primary-gold)]/10 transition-all border border-white/5 hover:border-[var(--primary-gold)]/30">
                    <ion-icon name="call-outline"></ion-icon>
                  </a>
                )}
                <a href={`mailto:${m.email}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-[var(--primary-gold)] hover:bg-[var(--primary-gold)]/10 transition-all border border-white/5 hover:border-[var(--primary-gold)]/30">
                  <ion-icon name="mail-outline"></ion-icon>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center glass-card border-dashed border-white/10 py-32 max-w-7xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20 text-4xl mb-6 border border-white/5">
               <ion-icon name="search-outline"></ion-icon>
            </div>
            <h4 className="text-white text-lg font-bold mb-2">Gösterilecek Üye Yok</h4>
            <p className="text-[var(--text-muted)] text-sm max-w-xs">Bu kritere uygun kimse bulunamadı veya gizlilik sınırları nedeniyle liste boşaltıldı.</p>
        </div>
      )}

      <div className="mt-20 text-center">
        <Link href="/members" className="text-white/30 hover:text-[var(--primary-gold)] text-[10px] font-bold uppercase tracking-[3px] transition-all">
          ← PANELİNE GERİ DÖN
        </Link>
      </div>
    </div>
  );
}
