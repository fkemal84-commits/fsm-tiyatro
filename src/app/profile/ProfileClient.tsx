'use client';

import { useState, useRef } from 'react';
import { changePassword, updateProfile, uploadAvatar } from '@/app/actions';
import { compressImageOnClient } from '@/lib/client-compress';

export default function ProfileClient({ user }: { user: any }) {
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanFirstName = (user?.name || '').replace(/undefined/gi, '').trim();
  const cleanLastName = (user?.surname || '').replace(/undefined/gi, '').trim();
  const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Kulüp Üyesi';

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Süper Admin',
    ADMIN: 'Yönetici 👑',
    DIRECTOR: 'Yönetmen 🎬',
    ASST_DIRECTOR: 'Yrd. Yönetmen',
    AKTOR: 'Aktör 🎭',
    PLAYER: 'Oyuncu 🎭',
    EDITOR: 'İçerik Editörü',
    SALES: 'Satış & Gişe',
    MEMBER: 'Kulüp Üyesi',
  };

  const roleLabel = roleLabels[user?.role] || user?.role || 'Üye';

  const inputStyle = {
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-medium)',
    background: 'var(--input-bg)',
    color: 'var(--text-main)',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');

    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);
    if (res && 'success' in res && res.success) {
      setProfileMsg('Portfolyo bilgileriniz başarıyla güncellendi.');
    }
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const newPasswordConfirm = formData.get('newPasswordConfirm') as string;

    if (newPassword !== newPasswordConfirm) {
      setError('Yeni şifreler eşleşmiyor.');
      setPasswordLoading(false);
      return;
    }

    const hash = async (pwd: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(pwd);
      const h = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const hashedOld = await hash(currentPassword);
    const hashedNew = await hash(newPassword);

    const payload = new FormData();
    payload.append('currentPassword', hashedOld);
    payload.append('newPassword', hashedNew);

    const res = await changePassword(payload);
    if (res && 'error' in res && res.error) {
      setError(res.error);
    } else {
      setMessage('Şifreniz başarıyla değiştirildi.');
      (e.target as HTMLFormElement).reset();
    }
    setPasswordLoading(false);
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;

    setAvatarLoading(true);
    setAvatarError('');

    try {
      // Tarayıcıda 500x500 WebP formatına anında sıkıştır
      const compressedFile = await compressImageOnClient(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.80,
        mimeType: 'image/webp'
      });

      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(compressedFile);

      const formData = new FormData();
      formData.append('photo', compressedFile);

      const res = await uploadAvatar(formData);
      if (res && 'error' in res && res.error) {
        setAvatarError(res.error);
        setAvatarPreview(user?.photoUrl || null);
      }
    } catch (err: any) {
      setAvatarError(('error' in err ? undefined : (err as any).message) || 'Yükleme başarısız.');
      setAvatarPreview(user?.photoUrl || null);
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '8rem 5% 4rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* PROFİL VE PORTFOLYO ALANI */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          
          {/* Avatar Yükleme */}
          <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary-gold)', cursor: 'pointer', flexShrink: 0 }} onClick={() => fileInputRef.current?.click()}>
            <img 
              src={avatarPreview || "/default-avatar.svg"} 
              alt="Profil Fotoğrafı" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }} className="hover:!opacity-100">
              {avatarLoading ? '...' : 'Değiştir'}
            </div>
            <input 
              type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={(e) => { if (e.target.files && e.target.files[0]) handleFileChange(e.target.files[0]); }}
            />
          </div>

          <div>
            <h1 className="serif-font" style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 0.25rem 0', lineHeight: '1.2' }}>{fullName}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.6rem 0', fontSize: '0.875rem' }}>{user?.email} • {user?.phone || 'Telefon Kayıtsız'}</p>
            <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'var(--primary-gold-dim)', color: 'var(--primary-gold)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid var(--primary-gold-border)' }}>
              {roleLabel}
            </div>
          </div>
        </div>
        
        {avatarError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{avatarError}</div>}

        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 1rem 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', fontWeight: 'bold' }}>Portfolyo & Bilgiler</h3>
        
        {profileMsg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{profileMsg}</div>}

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Bölüm</label>
            <input 
              type="text" name="department" placeholder="Örn: Hukuk Fakültesi" defaultValue={user?.department || ''}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Daha Önce Oynadığınız Oyunlar</label>
            <textarea 
              name="pastPlays" placeholder="Örn: Hamlet, Lüküs Hayat..." rows={2} defaultValue={user?.pastPlays || ''}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Özel Yetenekler</label>
            <input 
              type="text" name="skills" placeholder="Örn: Eskrim, Şan, Dans, Enstrüman" defaultValue={user?.skills || ''}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Kısa Biyografi</label>
            <textarea 
              name="bio" placeholder="Sahne tecrübeniz ve motivasyonunuz..." rows={3} defaultValue={user?.bio || ''}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>İlgi Alanları / Hobiler</label>
            <input 
              type="text" name="hobbies" placeholder="Fotoğrafçılık, seslendirme..." defaultValue={user?.hobbies || ''}
              style={inputStyle}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem' }} disabled={profileLoading}>
            {profileLoading ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
          </button>
        </form>
      </div>

      {/* ŞİFRE İŞLEMLERİ */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 1rem 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', fontWeight: 'bold' }}>Şifre Güvenliği</h3>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        {message && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{message}</div>}

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Mevcut Şifreniz</label>
            <input 
              type="password" name="currentPassword" placeholder="••••••••" 
              style={inputStyle} required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Yeni Şifre (En az 6 karakter)</label>
            <input 
              type="password" name="newPassword" placeholder="••••••••" 
              style={inputStyle} required minLength={6} 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Yeni Şifre Tekrar</label>
            <input 
              type="password" name="newPasswordConfirm" placeholder="••••••••" 
              style={inputStyle} required minLength={6} 
            />
          </div>
          
          <button type="submit" className="btn btn-outline" style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem' }} disabled={passwordLoading}>
            {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>

    </div>
  );
}
