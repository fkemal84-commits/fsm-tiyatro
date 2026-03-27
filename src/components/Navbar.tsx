'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function Navbar({ session }: { session?: any }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const role = session?.user?.role;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link href="/" className="nav-logo">FSM<span>Tiyatro</span></Link>
      
      <ul className="nav-links">
        <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Ana Sayfa</Link></li>
        <li><Link href="/plays" className={pathname === '/plays' ? 'active' : ''}>Oyunlarımız</Link></li>
        <li><Link href="/blog" className={pathname === '/blog' ? 'active' : ''}>Blog & Haberler</Link></li>
        
        {session && (
          <li><Link href="/members" className={pathname === '/members' ? 'active' : ''}>Üye Panosu</Link></li>
        )}

        {(role === 'SUPERADMIN' || role === 'ADMIN') && (
          <li>
            <Link href="/tanerabi/dashboard" className={pathname.startsWith('/tanerabi') ? 'active' : ''} style={{ color: 'var(--primary-gold)' }}>
              Yönetim Paneli
            </Link>
          </li>
        )}

        {role === 'EDITOR' && (
          <li>
            <Link href="/tanerabi/dashboard" className={pathname.startsWith('/tanerabi') ? 'active' : ''} style={{ color: 'var(--primary-gold)' }}>
              Yazı Ekle
            </Link>
          </li>
        )}
      </ul>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {session ? (
          <>
            <Link href="/profile" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, transition: 'var(--transition)' }}>
              Profilim
            </Link>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className="btn" 
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', background: 'transparent' }}
            >
              Çıkış Yap
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, transition: 'var(--transition)' }}>Üye Girişi</Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.8rem', fontSize: '0.9rem' }}>Yeni Kayıt Ol</Link>
          </>
        )}
      </div>
    </nav>
  );
}
