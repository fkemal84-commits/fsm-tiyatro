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
      <section className="section" id="sponsorluk" style={{ background: 'linear-gradient(to bottom, var(--bg-dark), #1a0505, var(--bg-dark))', borderTop: 'var(--glass-border)', borderBottom: 'var(--glass-border)' }}>
        <ScrollReveal className="section-head">
          <span style={{ color: 'var(--primary-gold)', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>DESTEK & SPONSORLUK</span>
          <h2 className="serif-font" style={{ marginTop: '0.5rem' }}>Sanatın Ateşini Birlikte Canlandıralım</h2>
          <p>Üniversitemizin en köklü kulüplerinden biri olan FSM Tiyatro'nun bir parçası olun.</p>
        </ScrollReveal>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '4rem auto' }}>
          <ScrollReveal className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#CD7F32', fontSize: '1.5rem', marginBottom: '1rem' }}>🥉 Bronz Destek</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Oyun broşürlerimizde ve sosyal medya paylaşımlarımızda logonuz yer alsın.</p>
              <div style={{ color: 'var(--primary-gold)', fontSize: '1.2rem', fontWeight: 600 }}>Logolu Tanıtım</div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal className="glass-card">
            <div style={{ textAlign: 'center', border: '1px solid var(--primary-gold)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ color: '#C0C0C0', fontSize: '1.5rem', marginBottom: '1rem' }}>🥈 Gümüş Destek</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Öne çıkan marka entegrasyonu, temsil öncesi anons ve özel davetiye imkanı.</p>
              <div style={{ color: 'var(--primary-gold)', fontSize: '1.2rem', fontWeight: 600 }}>Marka Entegrasyonu</div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal className="glass-card">
            <div style={{ textAlign: 'center', boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ color: '#FFD700', fontSize: '1.5rem', marginBottom: '1rem' }}>🥇 Altın Sponsor</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>"Sahne Senin" dediğimiz ana prodüksiyon partnerimiz olun, tüm görünürlüklerde en üst sırada yer alın.</p>
              <div style={{ color: 'var(--primary-gold)', fontSize: '1.2rem', fontWeight: 600 }}>Stratejik Partnerlik</div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: '3rem', background: 'rgba(255,255,255,0.03)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '1.5rem' }}>Kurumsal ve Bireysel Destek İçin</h4>
            <p style={{ marginBottom: '2.5rem', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8 }}>
              Sanatın üniversite ortamında yaşaması, öğrencilerimizin yeteneklerini sahnede sergileyebilmesi ve daha büyük prodüksiyonlara imza atmamız için yanımızda olun. Siz de markanızla geleceğin sanatçılarına "Mümkün" deyin.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="mailto:sponsorluk@fsmtiyatro.com" className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>Sponsorluk Dosyasını İndir</a>
              <a href="https://wa.me/905XXXXXXX" className="btn btn-outline" style={{ padding: '1rem 2.5rem' }}>
                <ion-icon name="logo-whatsapp" style={{ marginRight: '0.8rem', fontSize: '1.2rem' }}></ion-icon> Anında İletişim
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
