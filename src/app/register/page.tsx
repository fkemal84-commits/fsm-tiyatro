'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const limited = digits.substring(0, 10);
    
    let formatted = '';
    if (limited.length > 0) {
      formatted += limited.substring(0, 3);
      if (limited.length > 3) formatted += ' ' + limited.substring(3, 6);
      if (limited.length > 6) formatted += ' ' + limited.substring(6, 8);
      if (limited.length > 8) formatted += ' ' + limited.substring(8, 10);
    }
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneDisplay(formatPhone(e.target.value));
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
    
    try {
      const password = formData.get('password') as string;
      if (password) {
        const hashed = await hashPassword(password);
        formData.set('password', hashed);
      }

      const res = await registerUser(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.pending) {
        setSuccessMessage("Kayıt talebiniz alındı! Okul dışı e-posta kullandığınız için hesabınız yönetici onayından sonra aktif edilecektir. Onaylandığında giriş yapabilirsiniz.");
        setLoading(false);
      } else {
        setSuccessMessage("Kayıt başarılı! Okul e-postanızla anında üye oldunuz. Şimdi giriş yapabilirsiniz.");
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch (err: any) {
      setError("Beklenmedik bir hata oluştu: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="hero flex items-center justify-center min-h-screen pt-20 md:pt-24 pb-10">
      <div className="glass-card w-[92%] max-w-[500px] p-6 md:p-10">
        
        {successMessage ? (
          <div className="text-center py-4">
             <div className="text-6xl md:text-7xl text-[var(--primary-gold)] mb-6">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
             </div>
             <h2 className="serif-font text-2xl md:text-3xl text-white mb-4">Süreç Başlatıldı</h2>
             <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed mb-8">{successMessage}</p>
             <a href="/login" className="btn btn-primary w-full">Giriş Sayfasına Dön</a>
          </div>
        ) : (
          <>
            <h2 className="serif-font text-3xl md:text-4xl text-[var(--primary-gold)] mb-2 text-center">Aileye Katıl</h2>
            <p className="text-[var(--text-muted)] mb-8 text-center text-xs md:text-sm">FSM Tiyatro ve Sinema Kulübü Resmi Öğrenci ve Üye Kayıt Formu</p>
            
            {error && <div className="bg-red-900/50 text-white p-3 rounded-lg mb-4 border border-red-500/30 text-sm text-center">{error}</div>}
 
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Adınız" 
                  className="flex-1 p-3.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[var(--primary-gold)]/50 transition-all" 
                  required 
                />
                <input 
                  type="text" 
                  name="surname" 
                  placeholder="Soyadınız" 
                  className="flex-1 p-3.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[var(--primary-gold)]/50 transition-all" 
                  required 
                />
              </div>
              
              <input 
                type="email" 
                name="email" 
                placeholder="Okul (fsm.edu.tr) veya Kişisel E-posta" 
                className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[var(--primary-gold)]/50 transition-all" 
                required 
              />
              
              <div className="flex gap-2">
                <select 
                  name="countryCode" 
                  className="w-[85px] p-3.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[var(--primary-gold)]/50 transition-all text-xs"
                  defaultValue="+90"
                >
                  <option value="+90">TR +90</option>
                  <option value="+1">US +1</option>
                  <option value="+44">UK +44</option>
                  <option value="+49">DE +49</option>
                  <option value="+33">FR +33</option>
                  <option value="+31">NL +31</option>
                  <option value="+971">UAE +971</option>
                  <option value="+966">SA +966</option>
                </select>
                <input 
                  type="tel" 
                  name="phone" 
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  placeholder="5XX XXX XX XX" 
                  inputMode="numeric"
                  className="flex-1 p-3.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[var(--primary-gold)]/50 transition-all" 
                  required 
                  title="Lütfen 10 haneli telefon numaranızı başında 0 olmadan giriniz"
                />
              </div>
              
              <input 
                type="password" 
                name="password" 
                placeholder="Sisteme Giriş Şifrenizi Belirleyin" 
                className="w-full p-3.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[var(--primary-gold)]/50 transition-all" 
                required 
                minLength={6} 
                autoComplete="new-password"
              />
              
              <label className="flex gap-3 items-start my-1 cursor-pointer group">
                <input type="checkbox" name="consent" className="mt-1 accent-[var(--primary-gold)]" required />
                <span className="text-[11px] md:text-xs text-[var(--text-muted)] leading-relaxed group-hover:text-white transition-colors">
                  Kişisel verilerimin kulüp faaliyetleri kapsamında işlenmesine dair <a href="#" className="underline text-[var(--primary-gold)]">Üye Aydınlatma ve Açık Rıza Metnini</a> okudum, anladım ve onaylıyorum.
                </span>
              </label>
 
              <button 
                type="submit" 
                className="btn btn-primary w-full mt-2 py-4 font-bold tracking-wider" 
                disabled={loading}
              >
                {loading ? 'Sisteme Kaydediliyor...' : 'Kaydı Tamamla ve Üye Ol'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
