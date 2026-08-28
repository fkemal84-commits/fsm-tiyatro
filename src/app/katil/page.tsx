import { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Kulübe Katıl | FSM Tiyatro',
  description: 'FSM Tiyatro öğrenci kulübüne katılın. Oyunculuk, sahne arkası, reji, ışık, ses ve organizasyon.',
};

export default async function KatilPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;
  const rawName = session?.user?.name || '';
  const cleanName = rawName.replace(/undefined/gi, '').trim() || session?.user?.email?.split('@')[0] || 'Kulüp Üyesi';

  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const areas = [
    { title: 'Oyunculuk', desc: 'Karakter çözümlemeleri, beden ve diksiyon pratikleri, sahne performansı.' },
    { title: 'Reji & Yönetmenlik', desc: 'Metin analizi, sahne trafiği ve reji vizyonu geliştirme.' },
    { title: 'Işık & Ses Tasarımı', desc: 'Sahne atmosferi, ışık mikseri ve oyun ses/müzik kumandası.' },
    { title: 'Dekor & Kostüm', desc: 'Mekan tasarımı, sahne dekoru inşası ve dönem kostümleri.' },
    { title: 'Dramaturgi & Metin', desc: 'Tiyatro tarihi araştırmaları, alt metin çözümlemeleri ve yazılar.' },
    { title: 'Medya & Fotoğraf', desc: 'Prova belgeseli, temsil fotoğrafçılığı, video ve afiş tasarımı.' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-24 pb-16 sm:pt-32 sm:pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Katıl', url: `${baseUrl}/katil` }
        ]} 
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        
        {/* Zaten Üye Olan Kullanıcılar İçin Bilgi Kartı */}
        {isLoggedIn && (
          <div className="p-5 sm:p-6 bg-[var(--primary-gold-dim)] border border-[var(--primary-gold-border)] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-gold)] block mb-1">
                KULÜP PORTALI
              </span>
              <h2 className="serif-font text-xl text-[var(--text-main)] font-bold">
                Zaten Kulüp Üyesisiniz, {cleanName}!
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Prova takviminizi incelemek, açık ekip ilanlarına başvurmak ve senaryolara erişmek için panonuzu açın.
              </p>
            </div>
            <Link href="/members" className="btn btn-primary text-xs font-bold px-6 py-3 whitespace-nowrap flex-shrink-0">
              Üye Panosunu Aç →
            </Link>
          </div>
        )}
        
        {/* Başlık ve Ana Mesaj */}
        <div>
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2 text-[10px]">SEÇMELER & KATILIM</span>
          <h1 className="serif-font text-2xl sm:text-4xl md:text-5xl text-[var(--text-main)] mb-3 sm:mb-4 leading-tight break-words">
            Burada Sadece Oyuncular Yok.
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] font-light leading-relaxed">
            FSM Tiyatro'da bir oyunu sıfırdan sahneye taşımak için rejiye, ışığa, sese, dekora, afişe ve sahne arkası koordinasyonuna ihtiyaç duyarız. Önceden tiyatro deneyiminizin olması gerekmez; merakınız ve öğrenme isteğiniz yeterlidir.
          </p>
        </div>

        {/* Çalışma Alanları Listesi */}
        <div className="editorial-card p-5 sm:p-8 bg-[var(--bg-surface)]">
          <h2 className="serif-font text-xl sm:text-2xl text-[var(--text-main)] mb-4 sm:mb-6">Neler Yapıyoruz?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {areas.map((a, i) => (
              <div key={i} className="space-y-1">
                <h3 className="font-bold text-xs sm:text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-gold)]"></span>
                  {a.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed pl-3.5">
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Nasıl Katılırım? */}
        <div className="editorial-card p-5 sm:p-8 bg-[var(--bg-surface)] space-y-5 sm:space-y-6">
          <h2 className="serif-font text-xl sm:text-2xl text-[var(--text-main)]">Nasıl Katılırım?</h2>
          
          <div className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed font-light">
            <p>
              <strong className="text-[var(--text-main)]">1. Öğrenci Kaydı:</strong> Aşağıdaki buton üzerinden üniversite e-postanızla (@stu.fsm.edu.tr) portala kayıt olun.
            </p>
            <p>
              <strong className="text-[var(--text-main)]">2. Tanışma Atölyesi:</strong> Sezon başında veya dönem içindeki tanışma toplantımıza ve atölyelerimize katılın.
            </p>
            <p>
              <strong className="text-[var(--text-main)]">3. Provalar:</strong> İlgilendiğiniz alanda veya oyun kadrosunda provalara başlayın.
            </p>
          </div>

          <div className="pt-5 sm:pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[var(--text-dim)]">Sorularınız için: info@fsmtiyatro.com</span>
            {isLoggedIn ? (
              <Link href="/members" className="btn btn-primary text-xs font-bold px-8 py-3 w-full sm:w-auto text-center">
                Üye Panosuna Git →
              </Link>
            ) : (
              <Link href="/register" className="btn btn-primary text-xs font-bold px-8 py-3 w-full sm:w-auto text-center">
                Öğrenci Kaydı Oluştur
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
