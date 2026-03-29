'use client';

import { useState, Suspense } from 'react';
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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Şifreler eşleşmiyor.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır.' });
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
      setMessage({ type: 'success', text: result.message || 'Şifre başarıyla güncellendi. Giriş yapabilirsiniz.' });
      setLoading(false);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  if (!token || !email) {
    return (
      <div className="glass-card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center' }}>
        <h2 className="serif-font" style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>Geçersiz Link</h2>
        <p style={{ color: 'var(--text-muted)' }}>Bu şifre sıfırlama linki geçersiz veya bozuk. Lütfen yeni bir link talep edin.</p>
        <Link href="/forgot-password" className="btn btn-outline" style={{ marginTop: '2rem', display: 'inline-block' }}>Yeni Link İste</Link>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
      <div className="mb-8">
        <div className="w-20 h-20 bg-[var(--primary-gold-dim)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--primary-gold)]/30">
          <ion-icon name="shield-checkmark-outline" style={{ fontSize: '2.5rem', color: 'var(--primary-gold)' }}></ion-icon>
        </div>
        <h2 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--primary-gold)', marginBottom: '0.5rem' }}>Şifreyi Güncelle</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Güçlü ve unutmayacağınız yeni bir şifre belirleyin.
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
        <input 
          type="password" 
          placeholder="Yeni Şifre" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
          required
        />
        <input 
          type="password" 
          placeholder="Yeni Şifre (Tekrar)" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
          {loading ? 'Güncelleniyor...' : 'Şifreyi Onayla'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="hero" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Suspense fallback={<div className="text-white">Yükleniyor...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
