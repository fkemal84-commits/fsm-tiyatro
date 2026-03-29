'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { completePasswordReset } from '@/app/actions';
import Link from 'next/link';

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

    const formData = new FormData();
    formData.append('token', token || '');
    formData.append('email', email || '');
    formData.append('newPassword', newPassword);

    const result = await completePasswordReset(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      setLoading(false);
    } else {
      setSuccess(true);
      setMessage({ type: 'success', text: 'Şifreniz başarıyla mühürlendi! Sahneye dönmeye hazırsınız.' });
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="glass-card animate-fadeIn" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
          <ion-icon name="alert-circle-outline" style={{ fontSize: '2.5rem', color: '#ff4444' }}></ion-icon>
        </div>
        <h2 className="serif-font" style={{ color: '#ff4444', fontSize: '2rem', marginBottom: '1rem' }}>Erişim Hatası</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Bu şifre sıfırlama talebi geçersiz veya süresi dolmuş. Güvenliğiniz için lütfen yeni bir talep oluşturun.</p>
        <Link href="/forgot-password" style={{ marginTop: '2rem', display: 'inline-block' }} className="btn btn-outline w-full py-3">Yeni Link Talep Et</Link>
      </div>
    );
  }

  if (success) {
    return (
       <div className="glass-card animate-fadeIn" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
        <div className="w-24 h-24 bg-[var(--primary-gold-dim)] rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--primary-gold)]/30 relative">
          <div className="absolute inset-0 rounded-full animate-ping bg-[var(--primary-gold)]/20 shadow-glow"></div>
          <ion-icon name="checkmark-done-outline" style={{ fontSize: '3rem', color: 'var(--primary-gold)' }}></ion-icon>
        </div>
        <h2 className="serif-font" style={{ fontSize: '2.4rem', color: 'var(--primary-gold)', marginBottom: '1rem' }}>Şifre Güncellendi!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Yeni şifreniz başarıyla kaydedildi. {countdown} saniye içinde giriş sayfasına yönlendiriliyorsunuz...
        </p>
        <Link href="/login" className="btn btn-primary w-full py-3 font-bold tracking-widest uppercase text-xs">
          Hemen Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fadeIn" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
      <div className="mb-10">
        <div className="w-20 h-20 bg-[var(--primary-gold-dim)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--primary-gold)]/30">
          <ion-icon name="lock-open-outline" style={{ fontSize: '2.5rem', color: 'var(--primary-gold)' }}></ion-icon>
        </div>
        <h2 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--primary-gold)', marginBottom: '0.5rem' }}>Yeni Şifre Belirleyin</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Lütfen sahneye giriş için kullanacağınız yeni şifrenizi giriniz.
        </p>
      </div>

      {message && (
        <div className={`fade-in-up p-4 mb-6 rounded-xl border text-sm ${
          message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-green-500/10 border-green-500/20 text-green-200'
        }`}>
          <div className="flex items-center gap-2 justify-center">
            <ion-icon name={message.type === 'error' ? "alert-circle" : "checkmark-circle"}></ion-icon>
            {message.text}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-gold)] transition-all group-focus-within:scale-110">
            <ion-icon name="key-outline"></ion-icon>
          </span>
          <input 
            type="password" 
            placeholder="Yeni Şifre" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black/40 text-white focus:border-[var(--primary-gold)] focus:ring-1 focus:ring-[var(--primary-gold)]/30 transition-all outline-none"
            required 
          />
        </div>

        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-gold)] transition-all group-focus-within:scale-110">
            <ion-icon name="refresh-outline"></ion-icon>
          </span>
          <input 
            type="password" 
            placeholder="Yeni Şifreyi Onayla" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black/40 text-white focus:border-[var(--primary-gold)] focus:ring-1 focus:ring-[var(--primary-gold)]/30 transition-all outline-none"
            required 
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-full py-4 font-bold tracking-widest uppercase text-xs mt-2 relative overflow-hidden group"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              GÜNCELLENİYOR...
            </span>
          ) : (
            'ŞİFREYİ MÜHÜRLE'
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="hero flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Arka plan dekoratif elementler */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[var(--primary-gold)]/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[var(--primary-gold)]/10 rounded-full blur-[100px]"></div>
      
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--primary-gold)]/20 border-t-[var(--primary-gold)] rounded-full animate-spin"></div>
          <p className="text-[var(--primary-gold)] font-bold animate-pulse">SAHNE HAZIRLANIYOR...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
