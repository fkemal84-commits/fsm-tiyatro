'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function AdminSecretLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Kayıtlı e-posta veya şifre hatalı. Gizli alana giriş reddedildi.');
      setLoading(false);
    } else {
      window.location.href = '/tanerabi/dashboard';
    }
  };

  return (
    <div className="hero" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--accent-red)' }}>
        <h2 className="serif-font" style={{ fontSize: '2rem', color: 'var(--accent-red)', marginBottom: '1.5rem' }}>Gizli Yönetici Protokolü</h2>
        
        {error && <div style={{ background: 'rgba(139,0,0,0.5)', border: '1px solid rgba(255,0,0,0.3)', color: '#fff', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Yönetici E-postası" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
            required
          />
          <input 
            type="password" 
            placeholder="Yetki Şifresi (Parola)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
            required
          />
          <button type="submit" className="btn btn-outline" style={{ marginTop: '1rem', borderColor: 'var(--accent-red)', color: 'var(--text-main)' }} disabled={loading}>
            {loading ? 'Yetki Doğrulanıyor...' : 'Ağa Katıl'}
          </button>
        </form>
      </div>
    </div>
  );
}
