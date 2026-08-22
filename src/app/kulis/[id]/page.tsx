import { adminDb } from '@/lib/firebase-admin';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BlogInteractions from '@/components/BlogInteractions';
import CitationBox from '@/components/CitationBox';
import { ArticleJsonLd, BreadcrumbsJsonLd } from '@/components/JsonLd';

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  if (!docSnap.exists) return { title: 'Yazı Bulunamadı | FSM Tiyatro' };
  const post = docSnap.data() as any;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  const pageUrl = `${baseUrl}/kulis/${resolvedParams.id}`;

  const publishDate = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
  const author = post.author || 'FSM Tiyatro';
  const abstract = post.academicMeta?.abstract || post.excerpt || (post.content || '').substring(0, 160);

  const otherMeta: Record<string, string> = {
    'citation_title': post.title,
    'citation_author': author,
    'citation_publication_date': publishDate.split('T')[0].replace(/-/g, '/'),
    'citation_journal_title': post.academicMeta?.journalTitle || 'FSM Tiyatro ve Sahne Sanatları Güncesi',
    'citation_publisher': 'Fatih Sultan Mehmet Vakıf Üniversitesi',
    'citation_language': 'tr',
    'citation_abstract_html_url': pageUrl,
    'DC.title': post.title,
    'DC.creator': author,
    'DC.date': publishDate,
    'DC.language': 'tr',
  };

  if (post.academicMeta?.pdfUrl) {
    otherMeta['citation_pdf_url'] = post.academicMeta.pdfUrl;
  }

  return {
    title: `${post.title} | FSM Tiyatro Kulis`,
    description: abstract,
    authors: [{ name: author }],
    openGraph: {
      title: post.title,
      description: abstract,
      url: pageUrl,
      type: 'article',
      publishedTime: publishDate,
      authors: [author],
      images: post.imageUrl ? [post.imageUrl] : [`${baseUrl}/brand-logo-v1.jpg`],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: abstract,
      images: post.imageUrl ? [post.imageUrl] : [`${baseUrl}/brand-logo-v1.jpg`],
    },
    other: otherMeta,
  };
}

export default async function KulisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const post = { id: docSnap.id, ...docSnap.data() as any };

  const commentsSnap = await adminDb.collection('posts').doc(resolvedParams.id).collection('comments').orderBy('createdAt', 'desc').get();
  const comments = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  const session = await getServerSession(authOptions);
  const currentUserEmail = session?.user?.email || undefined;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  const pageUrl = `${baseUrl}/kulis/${post.id}`;

  const isAcademic = post.academicMeta?.isAcademic || post.category === 'Akademik Bildiri';

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      {/* Yapısal Veri (JSON-LD) */}
      <ArticleJsonLd post={post} />
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Kulis', url: `${baseUrl}/kulis` },
          { name: post.title, url: pageUrl }
        ]} 
      />

      <div className="max-w-3xl mx-auto px-6">
        
        {/* Üst Geri Butonu */}
        <Link 
          href="/kulis" 
          className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary-gold)] uppercase tracking-wider inline-flex items-center gap-1.5 mb-8 transition-colors"
        >
          <ion-icon name="arrow-back-outline"></ion-icon> Kulis Yazılarına Dön
        </Link>

        {/* Yazı Kartı */}
        <article className="editorial-card p-8 md:p-12 bg-[var(--bg-surface)]">
          
          <div className="flex items-center justify-between text-xs mb-4 pb-4 border-b border-[var(--border-subtle)] text-[var(--text-dim)]">
            <span className="text-[var(--primary-gold)] font-bold uppercase tracking-wider">
              {post.category || 'Kulis'}
            </span>
            <span>
              {post.author ? `🖋️ ${post.author}` : 'FSM Tiyatro'} &bull; {post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </span>
          </div>

          <h1 className="serif-font text-3xl sm:text-4xl text-[var(--text-main)] mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Kapak Görseli */}
          {post.imageUrl && (
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8 border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          {/* Özet / Abstract (Varsa) */}
          {post.academicMeta?.abstract && (
            <div className="mb-8 p-5 bg-[var(--primary-gold-dim)] rounded-xl border border-[var(--primary-gold-border)] text-xs">
              <span className="font-bold text-[var(--primary-gold)] uppercase block mb-1">Özet</span>
              <p className="text-[var(--text-main)] italic leading-relaxed">{post.academicMeta.abstract}</p>
            </div>
          )}

          {/* Yazı Metni */}
          <div className="text-base leading-relaxed text-[var(--text-main)] font-light whitespace-pre-wrap mb-10">
            {post.content}
          </div>

          {/* Akademik Alıntı Aracı (Gerektiğinde açılır) */}
          {isAcademic && (
            <CitationBox 
              title={post.title}
              author={post.author || 'FSM Tiyatro'}
              date={post.createdAt}
              url={pageUrl}
              journal={post.academicMeta?.journalTitle}
              publisher={post.academicMeta?.publisher}
            />
          )}

          {/* Beğeni & Yorumlar */}
          <BlogInteractions 
            postId={resolvedParams.id} 
            initialLikes={post.likes || []} 
            initialComments={comments} 
            currentUserEmail={currentUserEmail}
          />
        </article>

      </div>
    </div>
  );
}
