'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function Navbar({ session }: { session?: any }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  }, [pathname]);

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
          <ul className="nav-links">
            <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</Link></li>
            
            {/* KULÜP DROPDOWN */}
            <li className="nav-dropdown">
              <span className="dropdown-trigger">
                Kulüp <ion-icon name="chevron-down-outline"></ion-icon>
              </span>
              <ul className="dropdown-menu">
                <li><Link href="/plays">Oyunlarımız 🎭</Link></li>
                <li><Link href="/#about">Hakkımızda ℹ️</Link></li>
                <li><Link href="/members">Üye Panosu 📋</Link></li>
              </ul>
            </li>

            <li><Link href="/blog" className={pathname === '/blog' ? 'active' : ''}>Blog</Link></li>
            
            {/* SAHNE ARKASI (DROPDOWN - AKTOR+) */}
            {(role === 'AKTOR' || role === 'SUPERADMIN' || role === 'ADMIN' || role === 'PLAYER' || role === 'DIRECTOR') && (
              <li className="nav-dropdown">
                <span className="dropdown-trigger" style={{ color: 'var(--primary-gold)' }}>
                  Sahne Arkası <ion-icon name="star-outline"></ion-icon>
                </span>
                <ul className="dropdown-menu">
                  <li><Link href="/members/rehearsals">Prova Takvimi 📅</Link></li>
                  <li><Link href="/members/team">Ekip Rehberi 👥</Link></li>
                  <li><Link href="/members/scripts">Senaryo Kasası 📄</Link></li>
                </ul>
              </li>
            )}
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
