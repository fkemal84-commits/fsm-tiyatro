import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Kulüp & Ekip | FSM Tiyatro',
  description: 'Fatih Sultan Mehmet Vakıf Üniversitesi Tiyatro Kulübü kimliği, sahne geleneği ve aktif topluluk ekibi.',
};

export default async function KulupPage() {
  let users: any[] = [];

  try {
    const snap = await adminDb.collection('users')
      .where('role', 'in', ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'EDITOR', 'SALES'])
      .get();

    users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[KULUP] Veri çekme hatası:", error);
  }

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Süper Admin',
    ADMIN: 'Yönetici & Reji 👑',
    DIRECTOR: 'Yönetmen 🎬',
    ASST_DIRECTOR: 'Yrd. Yönetmen',
    AKTOR: 'Oyuncu 🎭',
    PLAYER: 'Oyuncu 🎭',
    EDITOR: 'Editör 🖋️',
    SALES: 'Gişe 🎟️',
    MEMBER: 'Üye',
  };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-16 sm:pt-32 sm:pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Kulüp & Ekip', url: `${baseUrl}/kulup` }
        ]} 
      />

      <div className="max-w-[1380px] mx-auto px-[5%] space-y-12 sm:space-y-16">
        
        {/* 1. BİZ KİMİZ? (SAMİMİ KİMLİK) */}
        <div className="max-w-3xl">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2 text-[10px]">BİZ KİMİZ?</span>
          <h1 className="serif-font text-3xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-4 sm:mb-6 leading-tight break-words">
            Üniversitede Tiyatro Yapıyoruz.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)] font-light leading-relaxed mb-4">
            FSM Tiyatro; Fatih Sultan Mehmet Vakıf Üniversitesi bünyesinde faaliyet gösteren bağımsız bir öğrenci tiyatro kulübüdür. Klasik metinlerden çağdaş sahnelemelere; provalardan seyirci alkışına kadar tüm süreci öğrenciler olarak kolektif bir emekle inşa ediyoruz.
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-light leading-relaxed">
            Haliç Yerleşkesi sahnemizde her yıl yeni oyunlar sahneliyor, atölyeler düzenliyor ve festivallerde üniversitemizi temsil ediyoruz.
          </p>
        </div>

        {/* 2. EKİBİMİZ & KADRO */}
        <div className="pt-8 sm:pt-10 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
            <div>
              <h2 className="serif-font text-2xl sm:text-3xl text-[var(--text-main)]">Topluluk & Ekip</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-light">Sahnede ve perde arkasında emek veren ekip arkadaşlarımız</p>
            </div>
            <Link href="/katil" className="btn btn-primary !py-2 !px-4 text-xs font-bold w-full sm:w-auto text-center">
              Ekibe Katıl
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {users.map((user) => {
              const cleanFirstName = (user.name || '').replace(/undefined/gi, '').trim();
              const cleanLastName = (user.surname || '').replace(/undefined/gi, '').trim();
              const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ') || 'Kulüp Üyesi';
              const roleName = roleLabels[user.role] || user.role || 'Üye';

              return (
                <div key={user.id} className="editorial-card p-4 sm:p-5 bg-[var(--bg-surface)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-[var(--primary-gold)] flex-shrink-0">
                        <Image
                          src={user.photoUrl || '/default-avatar.svg'}
                          alt={fullName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="serif-font text-base text-[var(--text-main)] leading-snug">{fullName}</h3>
                        <span className="text-[10px] font-bold text-[var(--primary-gold)] block">
                          {roleName}
                        </span>
                      </div>
                    </div>

                    {user.department && (
                      <p className="text-[11px] text-[var(--text-dim)] mb-2">
                        {user.department}
                      </p>
                    )}

                    {user.bio && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed italic font-light">
                        "{user.bio}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. DESTEK OLMAK İSTER MİSİNİZ? (ZARİF & SADE BLOK) */}
        <div id="destek" className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
          <div className="space-y-1 max-w-xl">
            <h3 className="serif-font text-lg sm:text-xl text-[var(--text-main)]">FSM Tiyatro'ya Destek Olun</h3>
            <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed">
              Öğrenci prodüksiyonlarımıza, dekor/kostüm çalışmalarımıza veya festival katılımlarımıza ayni ya da kurumsal destek sağlamak için bizimle iletişime geçebilirsiniz.
            </p>
          </div>
          <a href="mailto:tiyatro@fsm.edu.tr" className="btn btn-outline text-xs font-bold w-full sm:w-auto flex-shrink-0 text-center">
            tiyatro@fsm.edu.tr
          </a>
        </div>

      </div>
    </div>
  );
}
