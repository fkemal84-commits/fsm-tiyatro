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
  const [mobileSubMenu, setMobileSubMenu] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isTicketQueryActive, setIsTicketQueryActive] = useState<boolean>(initialTicketQueryActive);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 40;
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
    setActiveDropdown(null);
    setMobileSubMenu(null);
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
    AKTOR: 'Aktör 🎭',
    PLAYER: 'Oyuncu 🎭',
    EDITOR: 'İçerik Editörü',
    SALES: 'Satış & Gişe',
    MEMBER: 'Kulüp Üyesi',
  };

  const roleLabel = roleLabels[role] || (role ? role : 'Üye');
  const isAdmin = role === 'SUPERADMIN' || role === 'ADMIN';

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 text-decoration-none group">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[var(--primary-gold)] shadow-sm flex-shrink-0">
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
            <span className="text-[10px] text-[var(--primary-gold)] tracking-[0.2em] uppercase font-semibold mt-0.5">
              Sinema & Tiyatro Topluluğu
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            
            {/* 1. SAHNE DROPDOWN */}
            <li 
              className="nav-dropdown"
              onMouseEnter={() => setActiveDropdown('sahne')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <span className={`dropdown-trigger ${(pathname.startsWith('/sahne') || pathname.startsWith('/plays') || pathname === '/arsiv' || pathname === '/biletimi-bul') ? 'active' : ''}`}>
                Sahne <ion-icon name="chevron-down-outline" style={{ fontSize: '0.8rem' }}></ion-icon>
              </span>
              <ul className={`dropdown-menu ${activeDropdown === 'sahne' ? 'show' : ''}`}>
                <li>
                  <Link href="/sahne">
                    <span className="font-bold text-[var(--text-main)] block">Sezon Repertuvarı</span>
                    <span className="text-[11px] text-[var(--text-dim)] block">Güncel sahnelenen oyunlar</span>
                  </Link>
                </li>
                <li>
                  <Link href="/arsiv">
                    <span className="font-bold text-[var(--text-main)] block">Dijital Arşiv</span>
                    <span className="text-[11px] text-[var(--text-dim)] block">Geçmiş sezon prodüksiyonları</span>
                  </Link>
                </li>
                {isTicketQueryActive && (
                  <li>
                    <Link href="/biletimi-bul">
                      <span className="font-bold text-[var(--primary-gold)] block">Biletimi Bul / Gişe</span>
                      <span className="text-[11px] text-[var(--text-dim)] block">Seyirci koltuk sorgulama</span>
                    </Link>
                  </li>
                )}
              </ul>
            </li>

            {/* 2. KULÜP DROPDOWN */}
            <li 
              className="nav-dropdown"
              onMouseEnter={() => setActiveDropdown('kulup')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <span className={`dropdown-trigger ${pathname.startsWith('/kulup') ? 'active' : ''}`}>
                Kulüp <ion-icon name="chevron-down-outline" style={{ fontSize: '0.8rem' }}></ion-icon>
              </span>
              <ul className={`dropdown-menu ${activeDropdown === 'kulup' ? 'show' : ''}`}>
                <li>
                  <Link href="/kulup">
                    <span className="font-bold text-[var(--text-main)] block">Manifestomuz & Tarihçe</span>
                    <span className="text-[11px] text-[var(--text-dim)] block">Vizyonumuz ve sahnemiz</span>
                  </Link>
                </li>
                <li>
                  <Link href="/kulup/ekip">
                    <span className="font-bold text-[var(--text-main)] block">Topluluk & Kadro</span>
                    <span className="text-[11px] text-[var(--text-dim)] block">Oyuncular ve teknik kadro</span>
                  </Link>
                </li>
                <li>
                  <Link href="/kulup/alumni">
                    <span className="font-bold text-[var(--text-main)] block">Mezunlar / Alumni</span>
                    <span className="text-[11px] text-[var(--text-dim)] block">Kulübümüzün kurucu hafızası</span>
                  </Link>
                </li>
              </ul>
            </li>

            {/* 3. ÜRETİM & ATÖLYE */}
            <li>
              <Link href="/uretim" className={pathname.startsWith('/uretim') ? 'active' : ''}>
                Üretim & Atölye
              </Link>
            </li>

            {/* 4. YAYIN MERKEZİ */}
            <li>
              <Link href="/yayin" className={(pathname.startsWith('/yayin') || pathname.startsWith('/blog')) ? 'active' : ''}>
                Yayın & Günce
              </Link>
            </li>

            {/* 5. MEDYA ARŞİVİ */}
            <li>
              <Link href="/medya" className={pathname.startsWith('/medya') ? 'active' : ''}>
                Medya
              </Link>
            </li>

            {/* 6. KULÜBE KATIL */}
            <li>
              <Link href="/katil" className={pathname === '/katil' ? 'active' : ''} style={{ color: 'var(--primary-gold)', fontWeight: 600 }}>
                Katıl
              </Link>
            </li>

            {/* 7. DESTEK & SPONSOR */}
            <li>
              <Link href="/destek" className={pathname === '/destek' ? 'active' : ''}>
                Destek
              </Link>
            </li>
          </ul>
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="desktop-actions">
          {/* TEMA DEĞİŞTİRİCİ */}
          <button 
            onClick={toggleTheme} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-main)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary-gold)] transition-all cursor-pointer"
            title={theme === 'dark' ? "Matine / Parşömen Moduna Geç" : "Gece / Sahne Moduna Geç"}
          >
            <ion-icon name={theme === 'dark' ? "sunny-outline" : "moon-outline"} style={{ fontSize: '1.1rem', color: theme === 'dark' ? 'var(--primary-gold)' : 'var(--text-main)' }}></ion-icon>
          </button>

          {currentSession?.user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/tanerabi/dashboard" className="admin-badge" title="Yönetim Konsolu">
                  <ion-icon name="shield-checkmark"></ion-icon>
                  <span>Yönetim</span>
                </Link>
              )}
              <Link href="/members" className="profile-link flex items-center gap-1.5" title="Üye Panosu">
                <ion-icon name="grid-outline"></ion-icon>
                <span>Pano</span>
              </Link>
              <Link href="/profile" className="profile-link flex items-center gap-1.5 font-bold text-xs">
                <ion-icon name="person-circle-outline" style={{ fontSize: '1.2rem' }}></ion-icon>
                <span>{cleanName}</span>
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-logout" title="Güvenli Çıkış">
                <ion-icon name="log-out-outline"></ion-icon>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-outline py-2 px-4 text-xs font-bold flex items-center gap-1.5">
              <ion-icon name="log-in-outline"></ion-icon>
              <span>Üye Girişi</span>
            </Link>
          )}
        </div>

        {/* MOBİL TOGGLE */}
        <div className="flex items-center gap-3 lg:hidden">
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

      {/* MOBİL DRAWER */}
      <div className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-content">
          <div className={`mobile-nav-links ${mobileSubMenu ? 'slide-left' : ''}`}>
            
            {/* 1. SEVİYE MOBİL MENÜ */}
            <div className="mobile-nav-level">
              <div className="mobile-dropdown-trigger" onClick={() => setMobileSubMenu('sahne')}>
                <span>🎭 Sahne & Prodüksiyon</span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </div>

              <div className="mobile-dropdown-trigger" onClick={() => setMobileSubMenu('kulup')}>
                <span>🏛️ Kulüp & Topluluk</span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </div>

              <Link href="/uretim" onClick={() => setIsMenuOpen(false)}>🎨 Üretim & Atölye</Link>
              <Link href="/yayin" onClick={() => setIsMenuOpen(false)}>📚 Yayın & Günce</Link>
              <Link href="/medya" onClick={() => setIsMenuOpen(false)}>📷 Medya Arşivi</Link>
              <Link href="/katil" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--primary-gold)' }}>✨ Kulübe Katıl</Link>
              <Link href="/destek" onClick={() => setIsMenuOpen(false)}>🤝 Destek & Sponsor</Link>
              {isTicketQueryActive && (
                <Link href="/biletimi-bul" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--primary-gold)' }}>🎟️ Biletimi Bul</Link>
              )}
            </div>

            {/* 2. SEVİYE MOBİL MENÜ (ALT MENÜLER) */}
            <div className="mobile-nav-level">
              <div className="mobile-back-btn" onClick={() => setMobileSubMenu(null)}>
                <ion-icon name="chevron-back-outline"></ion-icon> Ana Menüye Dön
              </div>

              {mobileSubMenu === 'sahne' && (
                <div className="mobile-sub-menu">
                  <Link href="/sahne" onClick={() => setIsMenuOpen(false)}>Sezon Repertuvarı</Link>
                  <Link href="/arsiv" onClick={() => setIsMenuOpen(false)}>Dijital Prodüksiyon Arşivi</Link>
                  {isTicketQueryActive && <Link href="/biletimi-bul" onClick={() => setIsMenuOpen(false)}>Bilet / Gişe Sorgulama</Link>}
                </div>
              )}

              {mobileSubMenu === 'kulup' && (
                <div className="mobile-sub-menu">
                  <Link href="/kulup" onClick={() => setIsMenuOpen(false)}>Manifestomuz & Tarihçe</Link>
                  <Link href="/kulup/ekip" onClick={() => setIsMenuOpen(false)}>Topluluk & Kadro Rehberi</Link>
                  <Link href="/kulup/alumni" onClick={() => setIsMenuOpen(false)}>Mezunlar / Alumni Ağı</Link>
                </div>
              )}
            </div>

          </div>

          {/* MOBİL DRAWER ALT ALANI */}
          <div className="mobile-drawer-footer">
            {currentSession?.user ? (
              <div>
                <div className="mobile-user-info">
                  <span className="user-name">{cleanName}</span>
                  <span className="user-role">{roleLabel}</span>
                </div>
                <div className="mobile-auth-btns">
                  {isAdmin && (
                    <Link href="/tanerabi/dashboard" onClick={() => setIsMenuOpen(false)} className="btn btn-primary w-full py-2.5 text-xs">
                      Yönetim Konsolu
                    </Link>
                  )}
                  <Link href="/members" onClick={() => setIsMenuOpen(false)} className="btn btn-outline w-full py-2.5 text-xs">
                    Üye Panosu
                  </Link>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="btn btn-outline w-full py-2.5 text-xs">
                    Profilim & Portfolyo
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-logout w-full py-2.5 text-xs mt-2">
                    Çıkış Yap
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary w-full py-3 text-center text-xs font-bold">
                  Üye Girişi Yap
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="btn btn-outline w-full py-3 text-center text-xs font-bold">
                  Kayıt Ol (Öğrenci Portalı)
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
