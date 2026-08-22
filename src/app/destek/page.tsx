import { Metadata } from 'next';
import { BreadcrumbsJsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Destek & Kurumsal İş Birlikleri | FSM Tiyatro',
  description: 'FSM Tiyatro prodüksiyonlarına, turnelere ve genç tiyatro sanatçılarına kurumsal destek ve sponsorluk imkanları.',
};

export default function DestekPage() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const sponsorPackages = [
    {
      title: "Tanıtım & İletişim Desteği",
      tier: "Etkinlik Partnerliği",
      border: "#a89078",
      desc: "Oyun afişleri, basılı broşürler, dijital biletler ve web sitemizde logonuzla gençlik ve sanatsever kitlelere ulaşın.",
      features: [
        "Basılı afiş ve el broşürlerinde logo yerleşimi",
        "Web sitemiz ve sosyal medya paylaşımlarında marka temsili",
        "Temsil öncesi fuaye alanında tanıtım standı imkanı",
        "Özel gösterimler için VIP davetiyeler"
      ]
    },
    {
      title: "Sezon Prodüksiyon Partnerliği",
      tier: "Ana Destekçi",
      border: "var(--primary-gold)",
      highlight: true,
      desc: "Sezon boyunca sahnelenen ana oyunların dekor, kostüm, ışık ve teknik prodüksiyonuna doğrudan katkı sağlayın.",
      features: [
        "Tüm sezon oyunlarında 'Ana Prodüksiyon Destekçisi' unvanı",
        "Sahne ve fuaye görsel materyallerinde birincil logo",
        "Basın bültenleri ve medya röportajlarında kurumsal teşekkür",
        "Kurum çalışanlarına özel kapalı temsil organizasyonu"
      ]
    },
    {
      title: "Turne & Festival Hamiliği",
      tier: "Stratejik Hami",
      border: "var(--accent-crimson-bright)",
      desc: "Ulusal ve uluslararası üniversite tiyatro festivallerinde, turnelerde genç oyuncularımızın yolunu açan hamimiz olun.",
      features: [
        "Festival ve turne katılımında marka görünürlüğü",
        "Özel belgesel ve video jeneriklerinde logo teşekkürü",
        "Kurumsal kültür-sanat plaketi ve onur üyeliği",
        "Öğrencilere doğrudan sahne sanatları burs/ekipman fonu"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Destek & Sponsorluk', url: `${baseUrl}/destek` }
        ]} 
      />

      {/* Header */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="max-w-3xl">
          <span className="editorial-tag text-[var(--primary-gold)] block mb-2">SANATIN VE GENÇLİĞİN YANINDA</span>
          <h1 className="serif-font text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] mb-6 leading-tight">
            Geleceğin Tiyatrocularına Destek Olun
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] font-light leading-relaxed">
            FSM Tiyatro, her yıl binlerce üniversite öğrencisine ve tiyatroseverine nitelikli sahne sanatları deneyimi sunar. Prodüksiyonlarımızın, festivallerimizin ve atölyelerimizin sürdürülebilirliği için kurumsal ve bireysel sanat destekçileriyle güven temelli ortaklıklar kuruyoruz.
          </p>
        </div>
      </div>

      {/* İŞ BİRLİĞİ PAKETLERİ */}
      <div className="max-w-[1380px] mx-auto px-[5%] mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sponsorPackages.map((pkg, idx) => (
            <div 
              key={idx} 
              className={`editorial-card p-8 bg-[var(--bg-surface)] flex flex-col justify-between ${pkg.highlight ? 'border-2 !border-[var(--primary-gold)] shadow-xl' : ''}`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: pkg.border }}>
                  {pkg.tier}
                </span>
                <h3 className="serif-font text-2xl text-[var(--text-main)] mb-3">{pkg.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 font-light">{pkg.desc}</p>
                
                <div className="space-y-2.5 pt-6 border-t border-[var(--border-subtle)]">
                  {pkg.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-main)]">
                      <ion-icon name="checkmark-circle" style={{ color: 'var(--primary-gold)', fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}></ion-icon>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-[var(--border-subtle)]">
                <a 
                  href="mailto:tiyatro@fsm.edu.tr?subject=FSM%20Tiyatro%20Kurumsal%20İş%20Birliği%20Talebi" 
                  className={`btn w-full py-3 text-xs font-bold ${pkg.highlight ? 'btn-primary' : 'btn-outline'}`}
                >
                  Detaylı Dosya & İletişim
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AYNİ DESTEK VE İLETİŞİM */}
      <div className="max-w-[1380px] mx-auto px-[5%]">
        <div className="editorial-card p-8 md:p-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="serif-font text-2xl text-[var(--text-main)]">Ayni Destek & Malzeme Katkısı</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl leading-relaxed font-light">
              Sahne kumaşları, ahşap/metal dekor malzemeleri, ses & ışık kabloları veya kostüm desteği ile de sahnemize doğrudan omuz verebilirsiniz.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a 
              href="mailto:tiyatro@fsm.edu.tr" 
              className="btn btn-primary text-xs tracking-wider"
            >
              tiyatro@fsm.edu.tr
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
