import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Mezunlar & Alumni Ağı | FSM Tiyatro',
  description: 'FSM Tiyatro sahnesine geçmiş yıllarda emek vermiş, kulübümüzün kurumsal hafızasını oluşturan mezunlarımız.',
};

export default async function AlumniPage() {
  let alumniUsers: any[] = [];

  try {
    const snap = await adminDb.collection('users')
      .where('membershipStatus', '==', 'ALUMNI')
      .get();

    alumniUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[ALUMNI] Veri çekme hatası:", error);
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Kulüp', url: `${baseUrl}/kulup` },
          { name: 'Mezunlar & Alumni', url: `${baseUrl}/kulup/alumni` }
        ]} 
      />

      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-subtle)] pb-8 gap-4">
          <div>
            <span className="editorial-tag text-[var(--primary-gold)] block mb-2">KURUMSAL HAFIZA & MEZUNLAR</span>
            <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)]">Mezunlar / Alumni Ağı</h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl font-light mt-2 leading-relaxed">
              Geçmiş sezonlarda sahnemizde oynamış, yönetmiş, ışığı yönlendirmiş ve FSM Tiyatro geleneğini inşa etmiş mezunlarımız.
            </p>
          </div>
          <Link href="/kulup/ekip" className="btn btn-outline text-xs tracking-wider self-start md:self-auto">
            Aktif Ekip Rehberi →
          </Link>
        </div>
      </div>

      <div className="max-w-[1380px] mx-auto px-[5%]">
        {alumniUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {alumniUsers.map((user) => {
              const cleanFirstName = (user.name || '').replace(/undefined/gi, '').trim();
              const cleanLastName = (user.surname || '').replace(/undefined/gi, '').trim();
              const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ') || 'Mezun Üye';

              return (
                <div key={user.id} className="editorial-card p-6 bg-[var(--bg-surface)] flex flex-col items-center text-center">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--primary-gold)] mb-4">
                    <Image
                      src={user.photoUrl || '/default-avatar.svg'}
                      alt={fullName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="serif-font text-lg text-[var(--text-main)] mb-1">{fullName}</h3>
                  <span className="text-[11px] font-bold text-[var(--primary-gold)] bg-[var(--primary-gold-dim)] px-2.5 py-0.5 rounded-full border border-[var(--primary-gold-border)] mb-2">
                    {user.graduationYear ? `${user.graduationYear} Mezunu` : 'Alumni'}
                  </span>
                  {user.department && (
                    <p className="text-xs text-[var(--text-muted)] mb-3">{user.department}</p>
                  )}
                  {user.bio && (
                    <p className="text-xs text-[var(--text-dim)] line-clamp-3 leading-relaxed italic">
                      "{user.bio}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="editorial-card p-12 text-center max-w-2xl mx-auto bg-[var(--bg-surface)]">
            <span className="text-3xl mb-3 block">🎓</span>
            <h3 className="serif-font text-2xl text-[var(--text-main)] mb-2">Alumni Veri Tabanı Düzenleniyor</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-6 font-light">
              FSM Tiyatro bünyesinde geçmişte yer almış tüm mezunlarımızın prodüksiyon kayıtları ve arşiv bilgileri dijital ortama aktarılmaktadır.
            </p>
            <Link href="/kulup" className="btn btn-outline text-xs">
              Kulüp Manifestosuna Dön
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
