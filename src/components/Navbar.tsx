'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function Navbar({ session }: { session?: any }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sayfa değiştiğinde menüyü otomatik kapat
  useEffect(() => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const toggleDropdown = (name: string) => {
    if (window.innerWidth <= 1024) {
      setActiveDropdown(activeDropdown === name ? null : name);
    }
  };

  const role = session?.user?.role;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-[var(--primary-gold)]/20 group-hover:border-[var(--primary-gold)] transition-all">
            <Image 
              src="/brand-logo-v1.jpg" 
              alt="FSM Tiyatro Logo" 
              fill 
              className="object-cover"
            />
          </div>
          <span className="serif-font text-2xl tracking-widest text-white group-hover:text-[var(--primary-gold)] transition-all">
            FSM <span className="text-[var(--primary-gold)]">TİYATRO</span>
          </span>
        </Link>
        
        {/* DESKTOP LINKS (Visible only on Desktop) */}
        <div className="desktop-nav">
          <ul className="nav-links">
            <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</Link></li>
            
            <li className="nav-dropdown">
              <span className="dropdown-trigger">
                Kulüp <ion-icon name="chevron-down-outline"></ion-icon>
              </span>
              <ul className="dropdown-menu">
                <li><Link href="/plays">Oyunlarımız</Link></li>
                <li><Link href="/#about">Hakkımızda</Link></li>
                <li><Link href="/members">Üye Panosu</Link></li>
              </ul>
            </li>

            <li><Link href="/blog" className={pathname === '/blog' ? 'active' : ''}>Blog</Link></li>
            
            {(role === 'AKTOR' || role === 'SUPERADMIN' || role === 'ADMIN' || role === 'PLAYER' || role === 'DIRECTOR') && (
              <li className="nav-dropdown">
                <span className="dropdown-trigger" style={{ color: 'var(--primary-gold)' }}>
                  Sahne Arkası <ion-icon name="chevron-down-outline"></ion-icon>
                </span>
                <ul className="dropdown-menu">
                  <li><Link href="/members/rehearsals">Prova Takvimi</Link></li>
                  <li><Link href="/members/team">Ekip Rehberi</Link></li>
                  <li><Link href="/members/scripts">Senaryo Kasası</Link></li>
                </ul>
              </li>
            )}
          </ul>
        </div>

        {/* MOBILE TOGGLE (Visible only on Mobile) */}
        <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <ion-icon name={isMenuOpen ? "close-outline" : "menu-outline"}></ion-icon>
        </button>

        {/* MOBILE DRAWER (Visible only on Mobile) */}
        <div className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-drawer-content">
            <ul className={`mobile-nav-links ${activeDropdown ? 'slide-left' : ''}`}>
              {/* LEVEL 1 */}
              <li className="mobile-nav-level">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>Ana Sayfa</Link>
                <div className="mobile-dropdown-trigger" onClick={() => setActiveDropdown('klub')}>
                  Kulüp <ion-icon name="chevron-forward-outline"></ion-icon>
                </div>
                <Link href="/blog" onClick={() => setIsMenuOpen(false)}>Blog</Link>
                {(role === 'AKTOR' || role === 'SUPERADMIN' || role === 'ADMIN' || role === 'PLAYER' || role === 'DIRECTOR') && (
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
                    <Link href="/#about" onClick={() => setIsMenuOpen(false)}>Hakkımızda</Link>
                    <Link href="/members" onClick={() => setIsMenuOpen(false)}>Üye Panosu</Link>
                  </div>
                )}
                {activeDropdown === 'stage' && (
                  <div className="mobile-sub-menu">
                    <Link href="/members/rehearsals" onClick={() => setIsMenuOpen(false)}>Prova Takvimi</Link>
                    <Link href="/members/team" onClick={() => setIsMenuOpen(false)}>Ekip Rehberi</Link>
                    <Link href="/members/scripts" onClick={() => setIsMenuOpen(false)}>Senaryo Kasası</Link>
                  </div>
                )}
              </li>
            </ul>

            <div className="mobile-nav-footer">
              {session ? (
                <div className="flex flex-col gap-3 w-full">
                  <Link href="/profile" className="mobile-footer-link" onClick={() => setIsMenuOpen(false)}>
                    <ion-icon name="person-circle-outline"></ion-icon> Profilim
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-logout-mobile">Çıkış Yap</button>
                </div>
              ) : (
                <div className="mobile-auth-grid">
                  <Link href="/login" className="mobile-auth-btn secondary" onClick={() => setIsMenuOpen(false)}>Giriş</Link>
                  <Link href="/register" className="mobile-auth-btn primary" onClick={() => setIsMenuOpen(false)}>Kayıt Ol</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="desktop-actions">
          {session ? (
            <>
              <Link href="/profile" className="profile-link">Profilim</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-logout">Çıkış Yap</button>
            </>
          ) : (
            <>
              <Link href="/login" className="login-link">Üye Girişi</Link>
              <Link href="/register" className="btn btn-primary nav-reg-btn">Yeni Kayıt Ol</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
