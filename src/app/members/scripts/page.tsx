import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import ScriptVault from "@/components/ScriptVault";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Senaryo Kütüphanesi",
  description: "FSM Tiyatro prodüksiyonları için dijital senaryo arşivi.",
};

export default async function ScriptsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Sadece aktör ve üstü görebilir
  if (!['AKTOR', 'DIRECTOR', 'SUPERADMIN', 'ADMIN'].includes(role)) {
    redirect('/members');
  }

  const scriptsSnapshot = await adminDb.collection('scripts').get();
  const scripts = scriptsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() as any }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const canManage = ['SUPERADMIN', 'ADMIN', 'DIRECTOR'].includes(role);

  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="serif-font text-4xl text-[var(--primary-gold)] mb-4 italic">Dijital Senaryo Kasası</h1>
          <p className="text-[var(--text-muted)]">Oyunlarımızın en güncel metinlerine buradan ulaşabilirsin.</p>
        </header>
        
        <ScriptVault initialScripts={scripts} canManage={canManage} />
      </div>
    </div>
  );
}
