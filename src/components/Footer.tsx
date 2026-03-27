export default function Footer() {
  return (
    <footer style={{ padding: '4rem 5%', textAlign: 'center', borderTop: 'var(--glass-border)', marginTop: '4rem', background: 'rgba(0,0,0,0.5)' }}>
      <h2 className="serif-font" style={{ color: 'var(--primary-gold)', marginBottom: '1rem', fontSize: '2rem' }}>FSM Tiyatro</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Fatih Sultan Mehmet Vakıf Üniversitesi <br /> Sinema ve Tiyatro Kulübü</p>
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>&copy; 2026 FSM Tiyatro. Tüm hakları saklıdır.</p>
    </footer>
  );
}
