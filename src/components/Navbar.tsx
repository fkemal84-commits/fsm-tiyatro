'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Navbar({ session: initialSession, initialTicketQueryActive = true }: { session?: any; initialTicketQueryActive?: boolean }) {
  const { data: session } = useSession();
  const currentSession = session || initialSession;

  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isTicketQueryActive, setIsTicketQueryActive] = useState<boolean>(initialTicketQueryActive);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 50;
          setScrolled(prev => prev !== isScrolled ? isScrolled : prev);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Site yapılandırması (Biletimi Bul açık/kapalı durumu)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site_config"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.isTicketQueryActive === 'boolean') {
          setIsTicketQueryActive(data.isTicketQueryActive);
        }
      }
    });
    return () => unsub();
  }, []);

  // Tema yükleme ve takip (Varsayılan Daima Koyu Sahne Modu)
  useEffect(() => {
    const saved = localStorage.getItem('fsm_theme') as 'light' | 'dark' | null;
    if (saved === 'light') {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('fsm_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Menü açıkken arka plan kaymasını engelle
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Sayfa değiştiğinde menüyü otomatik kapat
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
    document.body.style.overflow = 'unset';
  }, [pathname]);

  const role = currentSession?.user?.role;
  // İsim düzeltmesi: undefined/null parçalarını temizle, surname yoksa email göster
  const userName = currentSession?.user?.name || '';
  const userSurname = (currentSession?.user as any)?.surname || '';
  const cleanName = [userName, userSurname]
    .map(s => (s || '').replace(/undefined/gi, '').trim())
    .filter(Boolean)
    .join(' ') || currentSession?.user?.email?.split('@')[0] || 'Üye';

  // Rol etiketi (makine dilinden okunabilir Türkçeye)
  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Süper Admin',
    ADMIN: 'Admin',
    EDITOR: 'Editör',
    SALES: 'Satış',
    DIRECTOR: 'Yönetmen',
    ASST_DIRECTOR: 'Yrd. Yönetmen',
    AKTOR: 'Aktör',
    MEMBER: 'Üye',
    PENDING: 'Onay Bekliyor',
  };
  const roleLabel = roleLabels[role || ''] || role || '';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ position: 'relative', width: '40px', height: '40px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-medium)', flexShrink: 0 }}>
            <Image 
              src="/brand-logo-v1.jpg" 
              alt="FSM Tiyatro Logo" 
              fill 
              style={{ objectFit: 'cover' }}
            />
          </div>
          <span className="serif-font" style={{ fontSize: '1.5rem', letterSpacing: '0.1em', color: 'var(--text-main)' }}>
            FSM <span style={{ color: 'var(--primary-gold)' }}>TİYATRO</span>
          </span>
        </Link>
        
        {/* DESKTOP LINKS */}
        <div className="desktop-nav">
          <ul className="nav-links">
            <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</Link></li>
            
            {isTicketQueryActive && (
              <li>
                <Link href="/biletimi-bul" className={pathname === '/biletimi-bul' ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-gold)', fontWeight: 600 }}>
                   <ion-icon name="qr-code-outline"></ion-icon> Biletimi Bul
                </Link>
              </li>
            )}
            
            <li className="nav-dropdown">
              <span className="dropdown-trigger">
                Kulüp <ion-icon name="chevron-down-outline"></ion-icon>
              </span>
              <ul className="dropdown-menu">
                <li><Link href="/plays">Oyunlarımız</Link></li>
                <li><Link href="/#manifesto">Hakkımızda & Manifesto</Link></li>
                <li><Link href="/members">Üye Panosu</Link></li>
              </ul>
            </li>

            <li><Link href="/blog" className={pathname === '/blog' ? 'active' : ''}>Blog</Link></li>
            
            {(role === 'AKTOR' || role === 'SUPERADMIN' || role === 'ADMIN' || role === 'PLAYER' || role === 'DIRECTOR' || role === 'MEMBER' || role === 'SALES') && (
              <li className="nav-dropdown">
                <span className="dropdown-trigger" style={{ color: 'var(--primary-gold)' }}>
                  Sahne Arkası <ion-icon name="chevron-down-outline"></ion-icon>
                </span>
                <ul className="dropdown-menu">
                  <li><Link href="/members/rehearsals">Prova Takvimi</Link></li>
                  <li><Link href="/members/team">Ekip Rehberi</Link></li>
                  <li><Link href="/members/scripts">Senaryo Kasası</Link></li>
                  {(role === 'SUPERADMIN' || role === 'ADMIN' || role === 'SALES') && (
                    <li><Link href="/members/tickets" style={{ color: 'var(--primary-gold)' }}>🎫 Bilet Gişesi</Link></li>
                  )}
                </ul>
              </li>
            )}
          </ul>
        </div>

        {/* ACTIONS & THEME TOGGLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Tema Değiştirici Buton */}
          <button 
            onClick={toggleTheme}
            title={`Tema: ${theme === 'light' ? 'Matine Modu (Açık)' : 'Sahne Modu (Koyu)'}`}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s',
            }}
            aria-label="Tema Seçimi"
          >
            {theme === 'light' ? (
              <ion-icon name="sunny-outline" style={{ color: '#d97706' }}></ion-icon>
            ) : (
              <ion-icon name="moon-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
            )}
          </button>

          {/* DESKTOP ACTIONS */}
          <div className="desktop-actions">
            {currentSession ? (
              <>
                {currentSession.user?.isAdminMode && (
                  <span className="admin-badge">
                    <ion-icon name="shield-checkmark-outline"></ion-icon> Yönetici
                  </span>
                )}
                <Link href="/profile" className="profile-link">Profilim</Link>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-logout">Çıkış</button>
              </>
            ) : (
              <>
                <Link href="/login" className="login-link">Üye Girişi</Link>
                <Link href="/register" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem' }}>Kayıt Ol</Link>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <ion-icon name={isMenuOpen ? "close-outline" : "menu-outline"}></ion-icon>
          </button>
        </div>

        {/* MOBILE DRAWER — Sadece 1024px altında CSS ile görünür, masaüstünde kesinlikle gizli */}
        <div 
          style={{ display: 'none' }}
          className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={() => {
            if (!touchStart || !touchEnd) return;
            const distance = touchEnd - touchStart;
            if (distance > 70) {
              if (activeDropdown) { setActiveDropdown(null); }
              else { setIsMenuOpen(false); }
            }
            setTouchStart(null);
            setTouchEnd(null);
          }}
        >
          <div className="mobile-drawer-content">
            <ul className={`mobile-nav-links ${activeDropdown ? 'slide-left' : ''}`}>
              {/* LEVEL 1 */}
              <li className="mobile-nav-level">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>Ana Sayfa</Link>
                
                {isTicketQueryActive && (
                  <Link href="/biletimi-bul" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ion-icon name="qr-code-outline"></ion-icon> Biletimi Bul
                  </Link>
                )}

                <div className="mobile-dropdown-trigger" onClick={() => setActiveDropdown('klub')}>
                  Kulüp <ion-icon name="chevron-forward-outline"></ion-icon>
                </div>
                <Link href="/blog" onClick={() => setIsMenuOpen(false)}>Blog</Link>
                {(role === 'AKTOR' || role === 'SUPERADMIN' || role === 'ADMIN' || role === 'PLAYER' || role === 'DIRECTOR' || role === 'MEMBER' || role === 'SALES') && (
                  <div className="mobile-dropdown-trigger" style={{ color: 'var(--primary-gold)' }} onClick={() => setActiveDropdown('stage')}>
                    Sahne Arkası <ion-icon name="chevron-forward-outline"></ion-icon>
                  </div>
                )}
              </li>

              {/* LEVEL 2 */}
              <li className="mobile-nav-level secondary">
                <div className="mobile-back-btn" onClick={() => setActiveDropdown(null)}>
                  <ion-icon name="arrow-back-outline"></ion-icon> Geri
                </div>
                {activeDropdown === 'klub' && (
                  <div className="mobile-sub-menu">
                    <Link href="/plays" onClick={() => setIsMenuOpen(false)}>Oyunlarımız</Link>
                    <Link href="/#manifesto" onClick={() => setIsMenuOpen(false)}>Hakkımızda & Manifesto</Link>
                    <Link href="/members" onClick={() => setIsMenuOpen(false)}>Üye Panosu</Link>
                  </div>
                )}

                {activeDropdown === 'stage' && (
                  <div className="mobile-sub-menu">
                    <Link href="/members/rehearsals" onClick={() => setIsMenuOpen(false)}>Prova Takvimi</Link>
                    <Link href="/members/team" onClick={() => setIsMenuOpen(false)}>Ekip Rehberi</Link>
                    <Link href="/members/scripts" onClick={() => setIsMenuOpen(false)}>Senaryo Kasası</Link>
                    {(role === 'SUPERADMIN' || role === 'ADMIN' || role === 'SALES') && (
                      <Link href="/members/tickets" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--primary-gold)' }}>🎫 Bilet Gişesi</Link>
                    )}
                  </div>
                )}
              </li>
            </ul>

            {/* MOBILE FOOTER */}
            <div className="mobile-drawer-footer">
              {currentSession ? (
                <>
                  <div className="mobile-user-info">
                    <span className="user-name">{cleanName}</span>
                    <span className="user-role">{roleLabel}</span>
                  </div>
                  <Link href="/profile" className="btn btn-outline" onClick={() => setIsMenuOpen(false)}>Profilim</Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-logout">Çıkış Yap</button>
                </>
              ) : (
                <div className="mobile-auth-btns">
                  <Link href="/login" className="btn btn-outline" onClick={() => setIsMenuOpen(false)}>Üye Girişi</Link>
                  <Link href="/register" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Kayıt Ol</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
