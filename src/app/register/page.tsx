'use client';

import { useState } from 'react';
import { registerUser } from '@/app/actions';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default function Register() {
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const formatPhoneNumber = (value: string) => {
    let numbers = value.replace(/\D/g, '');
    // Eğer kullanıcı 0 ile başlarsa (örn 0532), 0'ı atıp 532'den başlat
    if (numbers.startsWith('0')) {
      numbers = numbers.slice(1);
    }
    numbers = numbers.slice(0, 10);
    setRawPhone(numbers);
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    if (numbers.length <= 8) return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)} ${numbers.slice(6)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneDisplay(formatted);
  };

  const hashPassword = async (pwd: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Ham telefon numarasını gönderiyoruz
    formData.set('phone', rawPhone);

    const rawPassword = formData.get('password') as string;
    const isSchoolEmail = (formData.get('email') as string || '').toLowerCase().endsWith('@stu.fsm.edu.tr');

    try {
      const hashedPassword = await hashPassword(rawPassword);
      formData.set('password', hashedPassword);

      const res = await registerUser(formData);
      if (res && 'error' in res && res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      if (!isSchoolEmail) {
        setSuccessMessage("Kayıt talebiniz alındı! Okul dışı e-posta kullandığınız için hesabınız yönetici onayından sonra aktif edilecektir. Onaylandığında giriş yapabilirsiniz.");
      } else {
        window.location.href = '/login?registered=true';
      }
    } catch (err: any) {
      setError("Beklenmedik bir hata oluştu: " + ('error' in err ? undefined : (err as any).message));
      setLoading(false);
    }
  };

  return (
    <div className="hero flex items-center justify-center min-h-screen pt-24 pb-12 bg-[var(--bg-dark)]">
      <div className="glass-card w-[92%] max-w-[500px] p-6 md:p-10">
        
        {successMessage ? (
          <div className="text-center py-4">
             <div className="text-6xl md:text-7xl text-[var(--primary-gold)] mb-6">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
             </div>
             <h2 className="serif-font text-2xl md:text-3xl text-[var(--text-main)] mb-4">Süreç Başlatıldı</h2>
             <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed mb-8">{successMessage}</p>
             <Link href="/login" className="btn btn-primary w-full">Giriş Sayfasına Dön</Link>
          </div>
        ) : (
          <>
            <span className="editorial-tag text-[var(--primary-gold)] block text-center mb-2">YENİ ÜYE KAYDI</span>
            <h2 className="serif-font text-3xl md:text-4xl text-[var(--text-main)] mb-2 text-center">Aileye Katıl</h2>
            <p className="text-[var(--text-muted)] mb-8 text-center text-xs md:text-sm">FSM Tiyatro ve Sinema Kulübü Resmi Öğrenci ve Üye Kayıt Formu</p>
            
            {error && <div className="bg-red-500/15 text-red-400 p-3 rounded-lg mb-4 border border-red-500/30 text-sm text-center">{error}</div>}
 
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5 w-full">
              {/* Ad ve Soyad (Taşmayı önleyen responsive grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Adınız" 
                  className="w-full min-w-0 p-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm" 
                  required 
                />
                <input 
                  type="text" 
                  name="surname" 
                  placeholder="Soyadınız" 
                  className="w-full min-w-0 p-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm" 
                  required 
                />
              </div>
              
              <input 
                type="email" 
                name="email" 
                placeholder="Okul (@stu.fsm.edu.tr) veya Kişisel E-posta" 
                className="w-full min-w-0 p-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm" 
                required 
              />
              
              <input 
                type="tel" 
                name="phone" 
                value={phoneDisplay}
                onChange={handlePhoneChange}
                placeholder="Telefon: 0 (5XX) XXX XX XX" 
                className="w-full min-w-0 p-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm" 
                required 
              />

              <input 
                type="text" 
                name="department" 
                placeholder="Bölümünüz (Örn: Hukuk, Mimarlık, Psikoloji)" 
                className="w-full min-w-0 p-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm" 
              />

              <input 
                type="password" 
                name="password" 
                placeholder="Güçlü bir şifre belirleyin" 
                className="w-full min-w-0 p-3.5 rounded-xl border border-[var(--border-medium)] bg-[var(--input-bg)] text-[var(--text-main)] outline-none focus:border-[var(--primary-gold)] transition-all text-sm" 
                required 
              />

              <div className="flex items-start gap-3 my-1 text-left">
                <input type="checkbox" name="consent" id="consent" required className="mt-1 accent-[var(--primary-gold)] flex-shrink-0 cursor-pointer" />
                <label htmlFor="consent" className="text-xs text-[var(--text-muted)] cursor-pointer leading-relaxed select-none">
                  Kulüp içi prova duyuruları, etkinlik takvimi ve koordinasyon iletişimlerinin tarafıma iletilmesini onaylıyorum.
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full py-3.5 text-sm font-bold tracking-wider mt-1" 
                disabled={loading}
              >
                {loading ? 'Kaydınız İşleniyor...' : 'Kayıt Ol'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
              Zaten bir hesabınız var mı? <Link href="/login" className="text-[var(--primary-gold)] font-bold hover:underline">Giriş Yapın</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
