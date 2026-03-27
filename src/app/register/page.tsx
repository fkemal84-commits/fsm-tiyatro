'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await registerUser(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        alert("Kayıt başarılı! Lütfen sisteme giriş yapın.");
        router.push('/login');
      }
    } catch {
      setError("Beklenmedik bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingTop: '6rem' }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '90%' }}>
        <h2 className="serif-font" style={{ fontSize: '2.5rem', color: 'var(--primary-gold)', marginBottom: '0.5rem', textAlign: 'center' }}>Aileye Katıl</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '1rem' }}>FSM Tiyatro ve Sinema Kulübü Resmi Öğrenci ve Üye Kayıt Formu</p>
        
        {error && <div style={{ background: 'rgba(139,0,0,0.5)', color: '#fff', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,0,0,0.3)' }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="text" name="name" placeholder="Adınız" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} required />
            <input type="text" name="surname" placeholder="Soyadınız" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} required />
          </div>
          <input type="email" name="email" placeholder="Okul (fsm.edu.tr) veya Kişisel E-posta" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} required />
          <input type="tel" name="phone" placeholder="Telefon Numarası (05XX)" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} required />
          <input type="password" name="password" placeholder="Sisteme Giriş Şifrenizi Belirleyin" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} required minLength={6} />
          
          <label style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', margin: '0.5rem 0', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <input type="checkbox" name="consent" style={{ marginTop: '0.2rem' }} required />
            <span style={{ lineHeight: '1.4' }}>Kişisel verilerimin kulüp faaliyetleri kapsamında işlenmesine dair <a href="#" style={{ color: 'var(--primary-gold)', textDecoration: 'underline' }}>Üye Aydınlatma ve Açık Rıza Metnini</a> okudum, anladım ve onaylıyorum.</span>
          </label>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Sisteme Kaydediliyor...' : 'Kaydı Tamamla ve Üye Ol'}
          </button>
        </form>
      </div>
    </div>
  );
}
