'use client';

import { useState, useRef } from 'react';
import { changePassword, updateProfile, uploadAvatar } from '@/app/actions';

export default function ProfileClient({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const res = await changePassword(formData);
    
    if (res?.error) setError(res.error);
    else { setMessage("Şifreniz başarıyla güncellendi!"); (e.target as HTMLFormElement).reset(); }
    setLoading(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');

    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);
    
    if (res?.error) alert("Profil güncellenirken hata oluştu.");
    else setProfileMsg("Profiliniz başarıyla kaydedildi!");
    setProfileLoading(false);
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(file.type)) {
      setAvatarError("Görsel desteklenmiyor. (PNG/JPG) yüklemeyi deneyin.");
      return;
    }
    
    setUploadingAvatar(true);
    setAvatarError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await uploadAvatar(formData);
    if (res?.error) {
      setAvatarError(res.error);
    } else {
      window.location.reload(); 
    }
    setUploadingAvatar(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const defaultAvatar = "/default-avatar.svg";

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            
            {/* DRAG AND DROP SENSÖRÜ */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '140px', height: '140px', borderRadius: '50%', border: dragActive ? '3px dashed var(--primary-gold)' : '3px solid var(--primary-gold)', cursor: 'pointer',
                position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', transition: 'all 0.2s',
                opacity: uploadingAvatar ? 0.5 : 1, flexShrink: 0
              }}
              title="Fotoğrafı Değiştirmek İçin Tıklayın veya Dosyayı Sürükleyin"
            >
              <img src={user?.photoUrl || defaultAvatar} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: dragActive ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', textShadow: '0 2px 5px rgba(0,0,0,0.9)', transition: 'all 0.2s', pointerEvents: 'none' }}>
                {uploadingAvatar ? 'YÜKLENİYOR...' : (
                  <>
                    <span style={{ fontSize: '1.5rem', marginBottom: '2px' }}>📷</span>
                    <span style={{ textAlign: 'center', lineHeight: '1.2', letterSpacing: '0.5px' }}>SEÇ VEYA<br/>SÜRÜKLE</span>
                  </>
                )}
              </div>
              <input 
                type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={(e) => { if (e.target.files && e.target.files[0]) handleFileChange(e.target.files[0]); }}
              />
            </div>

            <div>
              <h1 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--primary-gold)', marginBottom: '0.2rem', lineHeight: '1' }}>{user?.name} {user?.surname}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.8rem' }}>{user?.email} • {user?.phone || 'Telefon Kayıtsız'}</p>
              <div style={{ display: 'inline-block', padding: '0.3rem 1rem', background: 'rgba(212,175,55,0.15)', color: 'var(--primary-gold)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1px' }}>
                {user?.role === 'EDITOR' ? 'İÇERİK EDİTÖRÜ' : user?.role}
              </div>
            </div>
          </div>
          
          {avatarError && <div style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center', background: 'rgba(139,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>{avatarError}</div>}

          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Kendinizi Ekibe Tanıtın (Portfolyo)</h3>
          
          {profileMsg && <div style={{ background: 'rgba(0,128,0,0.4)', border: '1px solid rgba(0,255,0,0.3)', color: '#fff', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{profileMsg}</div>}

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" name="department" placeholder="Okuduğunuz Bölüm (Örn: Hukuk Fakültesi)" defaultValue={user?.department || ''}
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem' }} 
            />
            <textarea 
              name="hobbies" placeholder="Hobileriniz, ilgi alanlarınız veya sahne tecrübeleriniz..." rows={3} defaultValue={user?.hobbies || ''}
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '1rem', resize: 'vertical' }} 
            ></textarea>
            
            <button type="submit" className="btn" style={{ marginTop: '0.5rem', width: '100%', background: 'var(--primary-gold)', color: '#000', fontWeight: 'bold' }} disabled={profileLoading}>
              {profileLoading ? 'Kaydediliyor...' : 'Metin Bilgilerini Güncelle'}
            </button>
          </form>
        </div>

        {/* ŞİFRE İŞLEMLERİ */}
        <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Gizlilik ve Şifre Güvenliği</h3>
          
          {error && <div style={{ background: 'rgba(139,0,0,0.5)', border: '1px solid rgba(255,0,0,0.3)', color: '#fff', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
          {message && <div style={{ background: 'rgba(0,128,0,0.4)', border: '1px solid rgba(0,255,0,0.3)', color: '#fff', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" name="currentPassword" placeholder="Mevcut Sistem Şifreniz" 
              style={{ padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff' }} required 
            />
            <input 
              type="password" name="newPassword" placeholder="Yeni Şifre (En az 6 karakter)" 
              style={{ padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff' }} required minLength={6} 
            />
            <input 
              type="password" name="newPasswordConfirm" placeholder="Yeni Şifrenizi Doğrulayın" 
              style={{ padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff' }} required minLength={6} 
            />
            <button type="submit" className="btn btn-outline" style={{ marginTop: '0.5rem', width: '100%', borderColor: 'var(--text-muted)' }} disabled={loading}>
              {loading ? 'İşleniyor...' : 'Şifreyi Güvence Altına Al'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
