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
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
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
        
        {/* MOBİL MENÜ BUTONU */}
        <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <ion-icon name={isMenuOpen ? "close-outline" : "menu-outline"}></ion-icon>
        </button>

        <div className={`nav-content ${isMenuOpen ? 'open' : ''}`}>
          <ul className={`nav-links ${activeDropdown ? 'level-secondary' : ''}`}>
            {/* LEVEL 1: MAIN LINKS */}
            <li className="nav-level">
              <Link href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</Link>
              
              <div className="dropdown-trigger" onClick={() => toggleDropdown('klub')}>
                <span>Kulüp</span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </div>

              <Link href="/blog" className={pathname === '/blog' ? 'active' : ''}>Blog</Link>
              
              {(role === 'AKTOR' || role === 'SUPERADMIN' || role === 'ADMIN' || role === 'PLAYER' || role === 'DIRECTOR') && (
                <div className="dropdown-trigger" style={{ color: 'var(--primary-gold)' }} onClick={() => toggleDropdown('stage')}>
                  <span>Sahne Arkası</span>
                  <ion-icon name="chevron-forward-outline"></ion-icon>
                </div>
              )}
            </li>

            {/* LEVEL 2: SUB-MENU (ACTIVE DROPDOWN) */}
            <li className="nav-level secondary-level">
              <div className="back-button" onClick={() => setActiveDropdown(null)}>
                <ion-icon name="arrow-back-outline"></ion-icon> Geri
              </div>

              {activeDropdown === 'klub' && (
                <ul className="dropdown-menu-mobile">
                  <li><Link href="/plays">Oyunlarımız</Link></li>
                  <li><Link href="/#about">Hakkımızda</Link></li>
                  <li><Link href="/members">Üye Panosu</Link></li>
                </ul>
              )}

              {activeDropdown === 'stage' && (
                <ul className="dropdown-menu-mobile">
                  <li><Link href="/members/rehearsals">Prova Takvimi</Link></li>
                  <li><Link href="/members/team">Ekip Rehberi</Link></li>
                  <li><Link href="/members/scripts">Senaryo Kasası</Link></li>
                </ul>
              )}
            </li>
          </ul>

          <div className="nav-actions">
            {session ? (
              <>
                <Link href="/profile" className="profile-link">Profilim</Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="btn btn-logout"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="login-link">Üye Girişi</Link>
                <Link href="/register" className="btn btn-primary nav-reg-btn">Yeni Kayıt Ol</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
