import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Topluluk & Kadro Rehberi | FSM Tiyatro',
  description: 'FSM Tiyatro yönetmenleri, oyuncuları, sahne arkası ekibi ve departman sorumluları.',
};

export default async function PublicTeamPage() {
  let users: any[] = [];

  try {
    const snap = await adminDb.collection('users')
      .where('role', 'in', ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'AKTOR', 'PLAYER', 'EDITOR', 'SALES', 'MEMBER'])
      .get();

    users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[TEAM] Veri çekme hatası:", error);
  }

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Süper Admin',
    ADMIN: 'Yönetici & Reji 👑',
    DIRECTOR: 'Yönetmen 🎬',
    ASST_DIRECTOR: 'Yrd. Yönetmen',
    AKTOR: 'Aktör / Oyuncu 🎭',
    PLAYER: 'Aktör / Oyuncu 🎭',
    EDITOR: 'İçerik Editörü 🖋️',
    SALES: 'Gişe & Seyirci 🎟️',
    MEMBER: 'Topluluk Üyesi',
  };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Kulüp', url: `${baseUrl}/kulup` },
          { name: 'Topluluk & Kadro', url: `${baseUrl}/kulup/ekip` }
        ]} 
      />

      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-subtle)] pb-8 gap-4">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">TOPLULUK REHBERİ</span>
            <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)]">Topluluk & Kadro</h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl font-light mt-2 leading-relaxed">
              Sahnede ve perde arkasında FSM Tiyatro'yu var eden yönetmenlerimiz, oyuncularımız ve teknik sanatçılarımız.
            </p>
          </div>
          <Link href="/katil" className="btn btn-primary text-xs tracking-wider self-start md:self-auto">
            Ekibe Dahil Olun
          </Link>
        </div>
      </div>

      <div className="max-w-[1380px] mx-auto px-[5%]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {users.map((user) => {
            const cleanFirstName = (user.name || '').replace(/undefined/gi, '').trim();
            const cleanLastName = (user.surname || '').replace(/undefined/gi, '').trim();
            const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ') || 'Kulüp Üyesi';
            const roleName = roleLabels[user.role] || user.role || 'Üye';

            return (
              <div key={user.id} className="editorial-card p-6 bg-[var(--bg-surface)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--primary-gold)] flex-shrink-0">
                      <Image
                        src={user.photoUrl || '/default-avatar.svg'}
                        alt={fullName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="serif-font text-lg text-[var(--text-main)] leading-snug">{fullName}</h3>
                      <span className="text-[10px] font-bold text-[var(--primary-gold)] uppercase block mt-0.5">
                        {roleName}
                      </span>
                    </div>
                  </div>

                  {user.department && (
                    <p className="text-xs text-[var(--text-dim)] mb-2 font-medium">
                      🏛️ {user.department}
                    </p>
                  )}

                  {user.bio && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-4 italic font-light">
                      "{user.bio}"
                    </p>
                  )}
                </div>

                {user.skills && (
                  <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-dim)]">
                    <span className="font-bold text-[var(--text-muted)]">Yetenekler:</span> {user.skills}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
