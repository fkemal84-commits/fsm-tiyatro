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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isTicketQueryActive, setIsTicketQueryActive] = useState<boolean>(initialTicketQueryActive);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 30;
          setScrolled(prev => prev !== isScrolled ? isScrolled : prev);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'unset';
  }, [pathname]);

  const role = currentSession?.user?.role;
  const userName = currentSession?.user?.name || '';
  const userSurname = (currentSession?.user as any)?.surname || '';
  const cleanName = [userName, userSurname]
    .filter(Boolean)
    .join(' ')
    .replace(/undefined/gi, '')
    .trim() || currentSession?.user?.email?.split('@')[0] || 'Üye';

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Süper Admin',
    ADMIN: 'Yönetici 👑',
    DIRECTOR: 'Yönetmen 🎬',
    ASST_DIRECTOR: 'Yrd. Yönetmen',
    AKTOR: 'Oyuncu 🎭',
    PLAYER: 'Oyuncu 🎭',
    EDITOR: 'Editör',
    SALES: 'Gişe',
    MEMBER: 'Üye',
  };

  const roleLabel = roleLabels[role] || (role ? role : 'Üye');
  const isAdmin = role === 'SUPERADMIN' || role === 'ADMIN';

  const navLinks = [
    { label: 'Oyunlar', href: '/oyunlar' },
    { label: 'Etkinlikler', href: '/etkinlikler' },
    { label: 'Kulis', href: '/kulis' },
    { label: 'Kulüp', href: '/kulup' },
    ...(currentSession?.user 
      ? [{ label: 'Pano', href: '/members', highlight: true }] 
      : [{ label: 'Katıl', href: '/katil', highlight: true }]),
  ];

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 text-decoration-none group">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--primary-gold)] shadow-sm flex-shrink-0">
            <Image 
              src="/brand-logo-v1.jpg" 
              alt="FSM Tiyatro Logo" 
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col">
            <span className="serif-font text-base sm:text-lg font-bold text-[var(--text-main)] tracking-wide leading-none">
              FSM TİYATRO
            </span>
            <span className="text-[9px] text-[var(--primary-gold)] tracking-[0.2em] uppercase font-semibold mt-0.5">
              Üniversite Tiyatro Kulübü
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV — TERTEMİZ DİREKT LİNKLER */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`${pathname.startsWith(item.href) ? 'active' : ''} ${item.highlight ? '!text-[var(--primary-gold)] font-bold' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="desktop-actions">
          {/* BİLET SORGULAMA CTA */}
          {isTicketQueryActive && (
            <Link 
              href="/biletimi-bul" 
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                pathname === '/biletimi-bul'
                  ? 'bg-[var(--primary-gold)] text-black border-[var(--primary-gold)]'
                  : 'bg-[var(--primary-gold-dim)] text-[var(--primary-gold)] border-[var(--primary-gold-border)] hover:bg-[var(--primary-gold)] hover:text-black'
              }`}
            >
              <span>🎟️ Biletimi Bul</span>
            </Link>
          )}

          {/* TEMA DEĞİŞTİRİCİ */}
          <button 
            onClick={toggleTheme} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold)] transition-all cursor-pointer"
            title={theme === 'dark' ? "Matine / Parşömen Moduna Geç" : "Gece / Sahne Moduna Geç"}
          >
            <ion-icon name={theme === 'dark' ? "sunny-outline" : "moon-outline"} style={{ fontSize: '1rem', color: theme === 'dark' ? 'var(--primary-gold)' : 'var(--text-main)' }}></ion-icon>
          </button>

          {currentSession?.user ? (
            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <Link href="/tanerabi/dashboard" className="admin-badge text-[11px]" title="Yönetim Konsolu">
                  <ion-icon name="shield-checkmark"></ion-icon>
                  <span>Yönetim</span>
                </Link>
              )}
              <Link href="/profile" className="profile-link flex items-center gap-1.5 font-bold text-xs" title="Profilim">
                <ion-icon name="person-circle-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
                <span>{cleanName}</span>
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-logout !py-1 !px-2 text-xs" title="Çıkış Yap">
                <ion-icon name="log-out-outline"></ion-icon>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-outline !py-1.5 !px-3 text-xs font-bold flex items-center gap-1">
              <ion-icon name="log-in-outline"></ion-icon>
              <span>Giriş</span>
            </Link>
          )}
        </div>

        {/* MOBİL TOGGLE */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <button 
            onClick={toggleTheme} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] cursor-pointer"
          >
            <ion-icon name={theme === 'dark' ? "sunny-outline" : "moon-outline"} style={{ fontSize: '1rem', color: theme === 'dark' ? 'var(--primary-gold)' : 'var(--text-main)' }}></ion-icon>
          </button>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="mobile-toggle"
            aria-label="Menüyü Aç"
          >
            <ion-icon name={isMenuOpen ? "close-outline" : "menu-outline"}></ion-icon>
          </button>
        </div>

      </div>

      {/* MOBİL MENÜ — TERTEMİZ DİKEY LİSTE */}
      <div className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-content">
          <div className="flex flex-col gap-4 py-4">
            <Link href="/oyunlar" onClick={() => setIsMenuOpen(false)} className="serif-font text-2xl text-[var(--text-main)]">
              🎭 Oyunlar
            </Link>
            <Link href="/etkinlikler" onClick={() => setIsMenuOpen(false)} className="serif-font text-2xl text-[var(--text-main)]">
              🗓️ Etkinlikler
            </Link>
            <Link href="/kulis" onClick={() => setIsMenuOpen(false)} className="serif-font text-2xl text-[var(--text-main)]">
              📝 Kulis & Yazılar
            </Link>
            <Link href="/kulup" onClick={() => setIsMenuOpen(false)} className="serif-font text-2xl text-[var(--text-main)]">
              🏛️ Kulüp & Ekip
            </Link>
            {currentSession?.user ? (
              <Link href="/members" onClick={() => setIsMenuOpen(false)} className="serif-font text-2xl text-[var(--primary-gold)] font-bold">
                🎭 Pano
              </Link>
            ) : (
              <Link href="/katil" onClick={() => setIsMenuOpen(false)} className="serif-font text-2xl text-[var(--primary-gold)] font-bold">
                ✨ Kulübe Katıl
              </Link>
            )}
            {isTicketQueryActive && (
              <Link href="/biletimi-bul" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold text-[var(--primary-gold)] flex items-center gap-1 mt-2">
                🎟️ Biletimi Bul / Gişe
              </Link>
            )}
          </div>

          <div className="mobile-drawer-footer">
            {currentSession?.user ? (
              <div>
                <div className="mobile-user-info mb-3">
                  <span className="user-name text-sm font-bold">{cleanName}</span>
                  <span className="user-role text-xs text-[var(--primary-gold)]">{roleLabel}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {isAdmin && (
                    <Link href="/tanerabi/dashboard" onClick={() => setIsMenuOpen(false)} className="btn btn-primary w-full py-2 text-xs">
                      Yönetim Konsolu
                    </Link>
                  )}
                  <Link href="/members" onClick={() => setIsMenuOpen(false)} className="btn btn-outline w-full py-2 text-xs">
                    Üye Panosu
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-logout w-full py-2 text-xs">
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary w-full py-2.5 text-center text-xs font-bold">
                  Üye Girişi
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="btn btn-outline w-full py-2.5 text-center text-xs font-bold">
                  Öğrenci Kaydı
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
