import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";
import { addPost } from "@/app/actions";
import SmartFileInput from "@/components/SmartFileInput";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yeni Yazı Ekle | FSM Tiyatro Kulis",
  description: "Kulis, Blog ve Akademik Makale yayınlama editörü.",
};

import PostCreateForm from "@/components/PostCreateForm";

export default async function YeniYaziPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?callbackUrl=/kulis/yeni');
  }

  const role = (session.user as any)?.role;
  const userTitles: string[] = (session.user as any)?.titles || [];
  let canWrite = ['EDITOR', 'ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(role) ||
    userTitles.some((t: string) => t.includes('Editör') || t.includes('Yazar') || t.includes('Yönetmen') || t.includes('Admin'));

  if (!canWrite && session.user.email) {
    try {
      const uSnap = await adminDb.collection('users').where('email', '==', session.user.email.toLowerCase()).limit(1).get();
      if (!uSnap.empty) {
        const uData = uSnap.docs[0].data();
        const dbRole = uData.role;
        const dbTitles: string[] = uData.titles || [];
        if (['EDITOR', 'ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(dbRole) || dbTitles.some((t: string) => t.includes('Editör') || t.includes('Yazar') || t.includes('Yönetmen') || t.includes('Admin'))) {
          canWrite = true;
        }
      }
    } catch {}
  }

  if (!canWrite) {
    redirect('/kulis');
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Geri Butonu */}
        <Link 
          href="/kulis"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary-gold)] mb-6 transition-colors"
        >
          <ion-icon name="arrow-back-outline"></ion-icon>
          <span>Kulis Yazılarına Dön</span>
        </Link>

        {/* Editör Kartı */}
        <div className="editorial-card p-6 sm:p-10 bg-[var(--bg-surface)] space-y-8">
          <div className="border-b border-[var(--border-subtle)] pb-6">
            <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">
              YAZAR & EDİTÖR MASASI
            </span>
            <h1 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">
              Yeni Kulis & Makale Yazısı
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 font-light">
              Tiyatro incelemelerinizi, kulis günlüklerinizi veya akademik makalelerinizi doğrudan yayınlayın.
            </p>
          </div>

          <PostCreateForm authorName={session.user.name || session.user.email || 'Kulüp Editörü'} />
        </div>
      </div>
    </div>
  );
}
