import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PushNotificationManager from "@/components/PushNotificationManager";
import Providers from "@/components/Providers";
import SessionWatcher from "@/components/SessionWatcher";
import FlashAttendanceOverlay from "@/components/FlashAttendanceOverlay";
import PullToRefresh from "@/components/PullToRefresh";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://fsmtiyatro.com"),
  title: {
    default: "FSM Tiyatro | Sahnenin Büyüsü",
    template: "%s | FSM Tiyatro"
  },
  description: "Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü Resmi Web Sitesi. Sanatın, tutkunun ve hikayelerin buluşma noktası.",
  keywords: ["FSM Tiyatro", "FSMVU Tiyatro", "Fatih Sultan Mehmet Vakıf Üniversitesi", "Sinema Kulübü", "Tiyatro Kulübü", "İstanbul Tiyatro", "Üniversite Tiyatrosu"],
  authors: [{ name: "FSM Tiyatro Ekibi" }],
  openGraph: {
    title: "FSM Tiyatro | Sahnenin Büyüsü",
    description: "Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü Resmi Web Sitesi.",
    url: "https://fsmtiyatro.com",
    siteName: "FSM Tiyatro",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FSM Tiyatro | Sahnenin Büyüsü",
    description: "Fatih Sultan Mehmet Vakıf Üniversitesi Sinema ve Tiyatro Kulübü Resmi Web Sitesi.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FSM Tiyatro",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  let isTicketQueryActive = true;

  try {
    const [sess, configDoc] = await Promise.all([
      getServerSession(authOptions),
      adminDb.collection('settings').doc('site_config').get()
    ]);
    session = sess;
    if (configDoc.exists) {
      const data = configDoc.data();
      if (typeof data?.isTicketQueryActive === 'boolean') {
        isTicketQueryActive = data.isTicketQueryActive;
      }
    }
  } catch (e) {
    console.error("Layout data fetch error:", e);
  }

  return (
    <html lang="tr" className={`${outfit.variable} ${playfair.variable} ${cormorant.variable}`}>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon.png" />
        <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js" async></script>
        <script noModule={true} src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js" async></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </head>
      <body className="antialiased">
        <Providers session={session}>
          <SessionWatcher />
          <PullToRefresh />
          <PushNotificationManager session={session} />
          <FlashAttendanceOverlay />
          <Navbar session={session} initialTicketQueryActive={isTicketQueryActive} />
          {children}
          <Footer showTicketQuery={isTicketQueryActive} />
        </Providers>
      </body>
    </html>
  );
}
