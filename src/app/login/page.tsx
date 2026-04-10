'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const hashedPassword = await hashPassword(password);
      
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password: hashedPassword,
        isAdminEntry: "false",
      });

      if (res?.error) {
        setError('Kayıtlı e-posta veya şifre hatalı.');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError("Bağlantı hatası: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center' }}>
        <h2 className="serif-font" style={{ fontSize: '2.5rem', color: 'var(--primary-gold)', marginBottom: '1.5rem' }}>Üye Girişi</h2>
        
        {error && <div style={{ background: 'rgba(139,0,0,0.5)', border: '1px solid rgba(255,0,0,0.3)', color: '#fff', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input 
            type="email" 
            placeholder="Okul E-postasınız" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
            required
          />
          <input 
            type="password" 
            placeholder="Şifreniz" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Sisteme Gir'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <a href="/forgot-password" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:text-[var(--primary-gold)] transition-all">
            Şifremi Unuttum?
          </a>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Henüz kulübe üye değil misiniz? <a href="/register" style={{ color: 'var(--primary-gold)', textDecoration: 'underline' }}>Hemen Kayıt Olun</a>
        </p>
      </div>
    </div>
  );
}
