'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Navbar({ session: initialSession }: { session?: any }) {
  const { data: session } = useSession();
  const currentSession = session || initialSession;

  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [isTicketQueryActive, setIsTicketQueryActive] = useState<boolean>(true);
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

  // Tema yükleme ve takip
  useEffect(() => {
    const saved = localStorage.getItem('fsm_theme') as 'system' | 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      if (saved === 'system') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', saved);
      }
    }
  }, []);

  const toggleTheme = () => {
    let nextTheme: 'system' | 'light' | 'dark';
    if (theme === 'system') nextTheme = 'light';
    else if (theme === 'light') nextTheme = 'dark';
    else nextTheme = 'system';

    setTheme(nextTheme);
    localStorage.setItem('fsm_theme', nextTheme);
    if (nextTheme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', nextTheme);
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

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-[var(--border-medium)] group-hover:border-[var(--primary-gold)] transition-all">
            <Image 
              src="/brand-logo-v1.jpg" 
              alt="FSM Tiyatro Logo" 
              fill 
              className="object-cover"
            />
          </div>
          <span className="serif-font text-2xl tracking-widest text-[var(--text-main)] group-hover:text-[var(--primary-gold)] transition-all">
            FSM <span className="text-[var(--primary-gold)]">TİYATRO</span>
          </span>
        </Link>
        
        {/* DESKTOP LINKS */}
        <div className="desktop-nav">
          <ul className="nav-links">
            <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</Link></li>
            
            {/* Biletimi Bul Butonu (Admin tarafından açılıp kapatılabilir) */}
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
        <div className="flex items-center gap-3">
          
          {/* Tema Değiştirici Buton */}
          <button 
            onClick={toggleTheme}
            title={`Tema: ${theme === 'system' ? 'Otomatik (Sistem)' : theme === 'light' ? 'Sabah / Matine (Açık)' : 'Gece / Sahne (Koyu)'}`}
            className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--primary-gold)] hover:border-[var(--primary-gold-border)] flex items-center justify-center text-lg transition-all"
            aria-label="Tema Seçimi"
          >
            {theme === 'system' ? (
              <ion-icon name="contrast-outline"></ion-icon>
            ) : theme === 'light' ? (
              <ion-icon name="sunny-outline" style={{ color: '#d97706' }}></ion-icon>
            ) : (
              <ion-icon name="moon-outline" style={{ color: 'var(--primary-gold)' }}></ion-icon>
            )}
          </button>

          {/* DESKTOP ACTIONS */}
          <div className="desktop-actions">
            {currentSession ? (
              <>
                {currentSession.user.isAdminMode && (
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
                <Link href="/register" className="btn btn-primary nav-reg-btn text-xs py-2 px-5">Kayıt Ol</Link>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <ion-icon name={isMenuOpen ? "close-outline" : "menu-outline"}></ion-icon>
          </button>
        </div>

        {/* MOBILE DRAWER */}
        <div 
          className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={() => {
            if (!touchStart || !touchEnd) return;
            const distance = touchEnd - touchStart;
            const isLeftToRight = distance > 70; 
            
            if (isLeftToRight) {
              if (activeDropdown) {
                setActiveDropdown(null);
              } else {
                setIsMenuOpen(false);
              }
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

            {/* MOBILE FOOTER ACTIONS */}
            <div className="mobile-drawer-footer">
              {currentSession ? (
                <>
                  <div className="mobile-user-info">
                    <span className="user-name">{currentSession.user.name}</span>
                    <span className="user-role">{currentSession.user.role}</span>
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
