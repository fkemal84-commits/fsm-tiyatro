import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1 className="serif-font">Sahnenin Büyüsüne<br/>Hoş Geldiniz</h1>
          <p>Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü olarak sanatı, duyguyu ve hikayeyi sahneye taşıyor, her sezon iz bırakan eserlere imza atıyoruz.</p>
          <div className="hero-btns">
            <a href="/plays" className="btn btn-primary">Geçmiş Oyunlarımız</a>
            <a href="#sponsorluk" className="btn btn-outline">Bize Destek Olun</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section" id="about">
        <ScrollReveal className="section-head">
          <h2 className="serif-font">Biz Kimiz?</h2>
          <p>Üniversitemizin en üretken topluluklarından biri olarak, öğrencilerin sanatsal yönlerini keşfetmelerini sağlıyoruz.</p>
        </ScrollReveal>
        
        <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <ScrollReveal className="glass-card">
            <div style={{ fontSize: '2.5rem', color: 'var(--primary-gold)', marginBottom: '1rem', display: 'inline-block' }}>
              <ion-icon name="videocam-outline"></ion-icon>
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>Sinema Tutkusu</h3>
            <p style={{ color: 'var(--text-muted)' }}>Kısa filmler, senaryo okuma atölyeleri ve ortak film analizleriyle perdenin büyüsünü kampüse taşıyoruz.</p>
          </ScrollReveal>
          
          <ScrollReveal className="glass-card">
            <div style={{ fontSize: '2.5rem', color: 'var(--primary-gold)', marginBottom: '1rem', display: 'inline-block' }}>
              <ion-icon name="color-palette-outline"></ion-icon>
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>Tiyatro Ruhu</h3>
            <p style={{ color: 'var(--text-muted)' }}>Klasik eserlerden modern tiyatroya uzanan geniş bir yelpazede, profesyonel prodüksiyonlar çıkarıyoruz.</p>
          </ScrollReveal>
          
          <ScrollReveal className="glass-card">
            <div style={{ fontSize: '2.5rem', color: 'var(--primary-gold)', marginBottom: '1rem', display: 'inline-block' }}>
              <ion-icon name="people-outline"></ion-icon>
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>Büyük Bir Aile</h3>
            <p style={{ color: 'var(--text-muted)' }}>Farklı bölümlerden bir araya gelen yüzlerce üyemizle, sadece sosyal bir kulüp değil, büyük bir sanat ailesiyiz.</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Sponsorship Banner */}
      <section className="section" id="sponsorluk" style={{ background: 'rgba(139, 0, 0, 0.1)', borderTop: 'var(--glass-border)', borderBottom: 'var(--glass-border)' }}>
        <ScrollReveal className="section-head">
          <h2 className="serif-font">Sahneye Güç Verin</h2>
          <p>Sanatın ateşini harlamak için altın değerindeki destekçilerimizi bekliyoruz.</p>
        </ScrollReveal>
        <ScrollReveal>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
            <p style={{ marginBottom: '2.5rem', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8 }}>
              Sanatın üniversite ortamında yaşaması, öğrencilerimizin yeteneklerini sahnede sergileyebilmesi ve daha büyük prodüksiyonlara imza atmamız için kurumsal destekçiler arıyoruz. Siz de markanızla, geleceğin sanatçılarına "Sahne Senin!" deyin.
            </p>
            <a href="mailto:sponsorluk@fsmtiyatro.com" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>Sponsorluk Dosyamızı İsteyin</a>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
