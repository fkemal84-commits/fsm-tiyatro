import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Statik dosyaları ve API isteklerini hariç tut
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const currentHost = hostname.replace(/:\d+$/, ''); // Port numarasını temizle
  
  // 1. GİŞE & BİLET SUBDOMAINİ (bilet.fsmtiyatro.com, gise.fsmtiyatro.com)
  if (currentHost.startsWith('bilet.') || currentHost.startsWith('gise.')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/biletimi-bul', request.url));
    }
  }

  // 2. KULİS SUBDOMAINİ (kulis.fsmtiyatro.com, akademi.fsmtiyatro.com)
  if (currentHost.startsWith('kulis.') || currentHost.startsWith('akademi.')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/kulis', request.url));
    }
  }

  // 3. ADMİN & YÖNETİM SUBDOMAINİ (admin.fsmtiyatro.com)
  if (currentHost.startsWith('admin.')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/tanerabi', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js).*)',
  ],
};
