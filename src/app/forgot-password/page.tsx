'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/app/actions';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('email', email);

    const result = await requestPasswordReset(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: result.message || 'Sıfırlama linki gönderildi.' });
    }
    setLoading(false);
  };

  return (
    <div className="hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-card" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
        <div className="mb-8">
          <div className="w-20 h-20 bg-[var(--primary-gold-dim)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--primary-gold)]/30">
            <ion-icon name="key-outline" style={{ fontSize: '2.5rem', color: 'var(--primary-gold)' }}></ion-icon>
          </div>
          <h2 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--primary-gold)', marginBottom: '0.5rem' }}>Şifremi Unuttum</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Kayıtlı e-posta adresinizi girin, size bir sıfırlama linki gönderelim.
          </p>
        </div>
        
        {message && (
          <div style={{ 
            background: message.type === 'error' ? 'rgba(139,0,0,0.4)' : 'rgba(34,139,34,0.4)', 
            border: `1px solid ${message.type === 'error' ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)'}`, 
            color: '#fff', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-gold)]">
              <ion-icon name="mail-outline"></ion-icon>
            </span>
            <input 
              type="email" 
              placeholder="E-posta Adresiniz" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                padding: '1rem 1rem 1rem 3rem', 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.1)', 
                background: 'rgba(0,0,0,0.4)', 
                color: '#fff',
                width: '100%'
              }}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </button>
        </form>
        
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }} className="hover:text-[var(--primary-gold)] transition-colors">
            ← Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
