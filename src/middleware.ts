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

  // Hostname analizi (örn: bilet.fsmtiyatro.com, admin.localhost:3000)
  const currentHost = hostname.replace(/:\d+$/, ''); // Port numarasını temizle
  
  // 1. GİŞE & BİLET SUBDOMAINİ (bilet.fsmtiyatro.com, gise.fsmtiyatro.com)
  if (currentHost.startsWith('bilet.') || currentHost.startsWith('gise.')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/biletimi-bul', request.url));
    }
  }

  // 2. AKADEMİ & KULİS SUBDOMAINİ (akademi.fsmtiyatro.com, kulis.fsmtiyatro.com)
  if (currentHost.startsWith('akademi.') || currentHost.startsWith('kulis.')) {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/blog', request.url));
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js).*)',
  ],
};
