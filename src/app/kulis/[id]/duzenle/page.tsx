import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import PostEditForm from "@/components/PostEditForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  if (!docSnap.exists) return { title: 'Yazı Bulunamadı | FSM Tiyatro' };
  const post = docSnap.data() as any;
  return {
    title: `Düzenle: ${post.title || 'Yazı'} | FSM Tiyatro Kulis`,
    description: "Kulis ve blog yazısı düzenleme paneli.",
  };
}

export default async function KulisDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/login?callbackUrl=/kulis/${resolvedParams.id}/duzenle`);
  }

  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  if (!docSnap.exists) {
    notFound();
  }

  const post = { id: docSnap.id, ...docSnap.data() as any };

  const role = (session.user as any)?.role;
  const userTitles: string[] = (session.user as any)?.titles || [];
  const userEmail = session.user.email?.toLowerCase();

  const isOwner = !!(post.authorEmail && userEmail && post.authorEmail.toLowerCase() === userEmail);
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(role) || userTitles.some((t: string) => t.includes('Admin') || t.includes('Yönetici'));

  if (!isOwner && !isAdmin) {
    redirect(`/kulis/${resolvedParams.id}`);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Geri Butonu */}
        <Link 
          href={`/kulis/${post.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary-gold)] mb-6 transition-colors"
        >
          <ion-icon name="arrow-back-outline"></ion-icon>
          <span>Yazıya Geri Dön</span>
        </Link>

        {/* Editör Kartı */}
        <div className="editorial-card p-6 sm:p-10 bg-[var(--bg-surface)] space-y-8">
          <div className="border-b border-[var(--border-subtle)] pb-6">
            <span className="editorial-tag text-[var(--primary-gold)] block text-[10px] mb-1">
              ✏️ YAZI DÜZENLEME
            </span>
            <h1 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)]">
              Yazıyı Düzenle
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 font-light">
              Başlık, içerik, kategori ve ekleri güncelleyin. Yapay zeka asistanı metninizi geliştirmenize yardımcı olabilir.
            </p>
          </div>

          <PostEditForm post={post} />
        </div>
      </div>
    </div>
  );
}
