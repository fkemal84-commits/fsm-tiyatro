'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/app/actions';
import Link from 'next/link';

export const dynamic = "force-dynamic";

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

    if ('error' in result && result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: ((result as any).message) || 'Sıfırlama linki gönderildi.' });
    }
    setLoading(false);
  };

  return (
    <div className="hero flex items-center justify-center min-h-screen bg-[var(--bg-dark)] px-4">
      <div className="glass-card bg-[var(--bg-surface)] border-[var(--border-subtle)]" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
        <div className="mb-6">
          <div className="w-16 h-16 bg-[var(--primary-gold-dim)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--primary-gold-border)]">
            <ion-icon name="key-outline" style={{ fontSize: '2rem', color: 'var(--primary-gold)' }}></ion-icon>
          </div>
          <h2 className="serif-font text-3xl text-[var(--text-main)] mb-2">Şifremi Unuttum</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Kayıtlı e-posta adresinizi girin, size bir sıfırlama linki gönderelim.
          </p>
        </div>
        
        {message && (
          <div style={{ 
            background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', 
            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, 
            color: message.type === 'error' ? '#ef4444' : '#10b981', 
            padding: '0.85rem 1rem', 
            borderRadius: '10px', 
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            fontWeight: 'bold'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-gold)]">
              <ion-icon name="mail-outline"></ion-icon>
            </span>
            <input 
              type="email" 
              placeholder="E-posta Adresiniz" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-full py-3.5 font-bold text-xs uppercase tracking-wider" disabled={loading}>
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-[var(--border-subtle)]">
          <Link href="/login" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary-gold)] transition-colors">
            ← Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
