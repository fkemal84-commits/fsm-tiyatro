import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
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
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="tr">
      <head>
        <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js" async></script>
        <script noModule={true} src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js" async></script>
      </head>
      <body>
        <Navbar session={session} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
