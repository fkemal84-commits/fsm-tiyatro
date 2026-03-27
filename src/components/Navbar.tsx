'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
        <Link href="/" className="nav-logo">FSM<span>Tiyatro</span></Link>
        
        {/* MOBİL MENÜ BUTONU */}
        <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <ion-icon name={isMenuOpen ? "close-outline" : "menu-outline"}></ion-icon>
        </button>

        <div className={`nav-content ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</Link></li>
            <li><Link href="/plays" className={pathname === '/plays' ? 'active' : ''}>Oyunlarımız</Link></li>
            <li><Link href="/blog" className={pathname === '/blog' ? 'active' : ''}>Blog & Haberler</Link></li>
            
            {session && (
              <li><Link href="/members" className={pathname === '/members' ? 'active' : ''}>Üye Panosu</Link></li>
            )}

            {(role === 'SUPERADMIN' || role === 'ADMIN' || role === 'EDITOR') && (
              <li>
                <Link href="/tanerabi/dashboard" className={pathname.startsWith('/tanerabi') ? 'active' : ''} style={{ color: 'var(--primary-gold)' }}>
                  {role === 'EDITOR' ? 'İçerik Stüdyosu' : 'Yönetim Paneli'}
                </Link>
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
