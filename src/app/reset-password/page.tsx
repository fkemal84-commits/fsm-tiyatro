'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { completePasswordReset } from '@/app/actions';
import Link from 'next/link';

export const dynamic = "force-dynamic";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      router.push('/login');
    }
  }, [success, countdown, router]);

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Şifreler eşleşmiyor. Lütfen tekrar kontrol edin.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Güvenliğiniz için şifreniz en az 6 karakter olmalıdır.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const hashedNewPassword = await hashPassword(newPassword);

    const formData = new FormData();
    formData.append('token', token || '');
    formData.append('email', email || '');
    formData.append('newPassword', hashedNewPassword);

    const result = await completePasswordReset(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    } else {
      setSuccess(true);
      setMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi.' });
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="glass-card bg-[var(--bg-surface)] border-[var(--border-subtle)]" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
          <ion-icon name="alert-circle-outline" style={{ fontSize: '2rem', color: '#ef4444' }}></ion-icon>
        </div>
        <h2 className="serif-font" style={{ color: '#ef4444', fontSize: '1.8rem', marginBottom: '0.75rem' }}>Erişim Hatası</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.875rem' }}>Bu şifre sıfırlama talebi geçersiz veya süresi dolmuş. Lütfen yeni bir talep oluşturun.</p>
        <Link href="/forgot-password" className="btn btn-primary w-full py-3 mt-6 text-xs font-bold uppercase tracking-wider">Yeni Link Talep Et</Link>
      </div>
    );
  }

  if (success) {
    return (
       <div className="glass-card bg-[var(--bg-surface)] border-[var(--border-subtle)]" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
          <ion-icon name="checkmark-done-outline" style={{ fontSize: '2.5rem', color: '#10b981' }}></ion-icon>
        </div>
        <h2 className="serif-font text-3xl text-[var(--text-main)] mb-2">Şifre Güncellendi!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Yeni şifreniz başarıyla kaydedildi. {countdown} saniye içinde yönlendiriliyorsunuz...
        </p>
        <Link href="/login" className="btn btn-primary w-full py-3 font-bold tracking-wider uppercase text-xs">
          Hemen Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card bg-[var(--bg-surface)] border-[var(--border-subtle)]" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
      <div className="mb-6">
        <div className="w-16 h-16 bg-[var(--primary-gold-dim)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--primary-gold-border)]">
          <ion-icon name="lock-open-outline" style={{ fontSize: '2rem', color: 'var(--primary-gold)' }}></ion-icon>
        </div>
        <h2 className="serif-font text-3xl text-[var(--text-main)] mb-2">Yeni Şifre Belirleyin</h2>
        <p className="text-[var(--text-muted)] text-sm">
          Lütfen yeni şifrenizi giriniz.
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
            <ion-icon name="key-outline"></ion-icon>
          </span>
          <input 
            type="password" 
            placeholder="Yeni Şifre" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm"
            required 
          />
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-gold)]">
            <ion-icon name="refresh-outline"></ion-icon>
          </span>
          <input 
            type="password" 
            placeholder="Yeni Şifreyi Onayla" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm"
            required 
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-full py-3.5 font-bold tracking-wider uppercase text-xs mt-2"
          disabled={loading}
        >
          {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="hero flex items-center justify-center min-h-screen bg-[var(--bg-dark)]">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4 text-[var(--primary-gold)]">
          <p className="font-bold">Yükleniyor...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
