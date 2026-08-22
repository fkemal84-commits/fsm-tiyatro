'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default function Login() {
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
    <div className="hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div className="glass-card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
        <span className="editorial-tag text-[var(--primary-gold)] block mb-2">KULÜP PORTALI</span>
        <h2 className="serif-font" style={{ fontSize: '2.4rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Üye Girişi</h2>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input 
            type="email" 
            placeholder="Okul E-postanız" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }}
            required
          />
          <input 
            type="password" 
            placeholder="Şifreniz" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }}
            required
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link href="/forgot-password" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:text-[var(--primary-gold)] transition-all">
            Şifremi Unuttum?
          </Link>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Henüz kulübe üye değil misiniz? <Link href="/register" style={{ color: 'var(--primary-gold)', textDecoration: 'underline', fontWeight: 'bold' }}>Hemen Kayıt Olun</Link>
        </p>
      </div>
    </div>
  );
}
