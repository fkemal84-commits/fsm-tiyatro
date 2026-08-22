import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ekip Rehberimiz | FSM Tiyatro",
  description: "FSM Tiyatro kulübünün yetenekli aktörleri ve teknik ekibi.",
};

export default async function TeamDirectory(props: { searchParams: Promise<{ play?: string }> }) {
  const searchParams = await props.searchParams;
  const playFilter = searchParams.play || 'ALL';

  const session = await getServerSession(authOptions);
  const currentUserRole = (session?.user as any)?.role;

  if (!session) return <div className="pt-40 text-center text-[var(--text-main)]">Bu alanı görmek için giriş yapmalısınız.</div>;

  // Tüm oyunlar listesini çek (Filtreleme için)
  const playsSnap = await adminDb.collection('plays').get();
  const allPlays = playsSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));

  // KVKK Koruması: Sadece Yönetim (Admin/Direktör) iletişim bilgilerini görebilir
  const isPrivileged = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'].includes(currentUserRole);

  const usersSnap = await adminDb.collection('users').get();
  let members = usersSnap.docs
    .map(doc => {
      const data = doc.data();
      const rawName = data.name || '';
      const rawSurname = data.surname || '';
      const cleanFirst = rawName.replace(/undefined/gi, '').trim();
      const cleanLast = rawSurname.replace(/undefined/gi, '').trim();
      return { 
        id: doc.id, 
        name: cleanFirst, 
        surname: cleanLast, 
        email: isPrivileged ? data.email : '••••@••••.•••',
        role: data.role, 
        photoUrl: data.photoUrl || '', 
        bio: data.bio || '', 
        skills: data.skills || '', 
        phone: isPrivileged ? (data.phone || '') : '',
        assignedPlays: (data.assignedPlays as string[]) || [] 
      };
    })
    .filter(u => u.role !== 'USER' && u.name)
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
        <h1 className="serif-font text-5xl text-[var(--text-main)] mb-3">Ekip <span className="text-[var(--primary-gold)]">Rehberimiz</span></h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto italic text-sm">
          &ldquo;Sahne, her birimizin bir araya gelerek oluşturduğu muazzam bir tablodur.&rdquo;
        </p>
      </header>

      {/* FİLTRELEME ALANI */}
      <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-center gap-6 glass-card p-6 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] flex items-center justify-center text-2xl border border-[var(--primary-gold-border)]">
             <ion-icon name="filter-outline"></ion-icon>
           </div>
           <div>
             <h4 className="text-[var(--text-main)] text-sm font-bold uppercase tracking-widest leading-none">Kadroları Filtrele</h4>
             <p className="text-[11px] text-[var(--text-dim)] uppercase mt-1 tracking-wider">Oyun bazlı oyuncu listesi</p>
           </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
           <Link 
             href="/members/team?play=ALL"
             className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${
               playFilter === 'ALL' 
                ? 'bg-[var(--primary-gold)] text-black border-[var(--primary-gold)] shadow-md' 
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]'
             }`}
           >
             TÜM EKİP
           </Link>
           {allPlays.map(p => (
             <Link 
                key={p.id}
                href={`/members/team?play=${p.id}`}
                className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${
                  playFilter === p.id 
                    ? 'bg-[var(--primary-gold)] text-black border-[var(--primary-gold)] shadow-md' 
                    : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]'
                }`}
             >
                {p.title}
             </Link>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {members.map((m) => (
          <div key={m.id} className="glass-card group hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center p-8 relative overflow-hidden bg-[var(--bg-surface)] border-[var(--border-subtle)]">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[var(--primary-gold-border)] group-hover:border-[var(--primary-gold)] transition-all mb-5 relative z-10 shadow-lg">
              <img 
                src={m.photoUrl || "/default-avatar.svg"} 
                alt={m.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <h3 className="text-[var(--text-main)] text-xl font-bold mb-1 relative z-10 tracking-tight">{m.name} {m.surname}</h3>
            <div className="text-[var(--primary-gold)] text-[10px] font-bold uppercase tracking-widest mb-4 bg-[var(--primary-gold-dim)] py-1 px-3 rounded-full relative z-10 border border-[var(--primary-gold-border)]">
              {m.role === 'AKTOR' || m.role === 'PLAYER' ? 'Aktör 🎭' : 
               m.role === 'DIRECTOR' ? 'Yönetmen 🎬' : 
               m.role === 'ASST_DIRECTOR' ? 'Yrd. Yönetmen' : 
               m.role === 'ADMIN' ? 'Yönetici 👑' : 
               m.role === 'SUPERADMIN' ? 'Genel Yönetici' : 
               m.role === 'EDITOR' ? 'İçerik Editörü' : 'Üye'}
            </div>

            {m.bio && (
              <p className="text-[var(--text-muted)] text-xs mb-6 line-clamp-3 italic leading-relaxed font-light">&ldquo;{m.bio}&rdquo;</p>
            )}

            <div className="mt-auto w-full space-y-4 relative z-10">
              {m.skills && (
                <div className="text-left bg-[var(--bg-surface-elevated)] p-3 rounded-xl border border-[var(--border-subtle)]">
                  <span className="text-[var(--primary-gold)] text-[9px] font-bold uppercase block mb-1 tracking-widest">Öne Çıkanlar:</span>
                  <p className="text-[var(--text-main)] text-[11px] line-clamp-1">{m.skills}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-center gap-4">
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="w-10 h-10 rounded-full bg-[var(--bg-surface-elevated)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary-gold)] transition-all border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]">
                    <ion-icon name="call-outline"></ion-icon>
                  </a>
                )}
                <a href={`mailto:${m.email}`} className="w-10 h-10 rounded-full bg-[var(--bg-surface-elevated)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary-gold)] transition-all border border-[var(--border-subtle)] hover:border-[var(--primary-gold-border)]">
                  <ion-icon name="mail-outline"></ion-icon>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center glass-card border-dashed border-[var(--border-medium)] py-32 max-w-7xl mx-auto flex flex-col items-center">
            <div className="w-20 h-20 bg-[var(--bg-surface-elevated)] rounded-full flex items-center justify-center text-[var(--text-dim)] text-4xl mb-6 border border-[var(--border-subtle)]">
               <ion-icon name="search-outline"></ion-icon>
            </div>
            <h4 className="text-[var(--text-main)] text-lg font-bold mb-2">Gösterilecek Üye Yok</h4>
            <p className="text-[var(--text-muted)] text-sm max-w-xs">Bu kritere uygun kimse bulunamadı.</p>
        </div>
      )}

      <div className="mt-20 text-center">
        <Link href="/members" className="text-[var(--text-dim)] hover:text-[var(--primary-gold)] text-xs font-bold uppercase tracking-wider transition-all">
          ← Üye Panosuna Dön
        </Link>
      </div>
    </div>
  );
}
