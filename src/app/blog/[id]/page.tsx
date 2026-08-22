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
  if (!docSnap.exists) return { title: 'Yazı Bulunamadı' };
  const post = docSnap.data() as any;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  const pageUrl = `${baseUrl}/blog/${resolvedParams.id}`;

  const publishDate = post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString();
  const year = post.createdAt ? new Date(post.createdAt).getFullYear().toString() : new Date().getFullYear().toString();
  const author = post.author || 'FSM Tiyatro Araştırma Ekibi';
  const abstract = post.academicMeta?.abstract || post.excerpt || (post.content || '').substring(0, 160);

  // Google Scholar & Dublin Core Akademik Meta Etiketleri
  const otherMeta: Record<string, string> = {
    'citation_title': post.title,
    'citation_author': author,
    'citation_publication_date': publishDate.split('T')[0].replace(/-/g, '/'),
    'citation_journal_title': post.academicMeta?.journalTitle || 'FSM Tiyatro ve Sahne Sanatları Güncesi',
    'citation_publisher': post.academicMeta?.publisher || 'Fatih Sultan Mehmet Vakıf Üniversitesi',
    'citation_language': 'tr',
    'citation_abstract_html_url': pageUrl,
    'DC.title': post.title,
    'DC.creator': author,
    'DC.date': publishDate,
    'DC.publisher': 'Fatih Sultan Mehmet Vakıf Üniversitesi',
    'DC.language': 'tr',
  };

  if (post.academicMeta?.pdfUrl) {
    otherMeta['citation_pdf_url'] = post.academicMeta.pdfUrl;
  }

  return {
    title: `${post.title} | FSM Tiyatro`,
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

export default async function BlogDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const docSnap = await adminDb.collection('posts').doc(resolvedParams.id).get();
  
  if (!docSnap.exists) notFound();
  const post = { id: docSnap.id, ...docSnap.data() as any };

  const commentsSnap = await adminDb.collection('posts').doc(resolvedParams.id).collection('comments').orderBy('createdAt', 'desc').get();
  const comments = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  const session = await getServerSession(authOptions);
  const currentUserEmail = session?.user?.email || undefined;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';
  const pageUrl = `${baseUrl}/blog/${post.id}`;

  const isAcademic = post.academicMeta?.isAcademic || post.category === 'Akademik Bildiri';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Yapısal Veri (JSON-LD) */}
      <ArticleJsonLd post={post} />
      <BreadcrumbsJsonLd 
        items={[
          { name: 'Ana Sayfa', url: baseUrl },
          { name: 'Blog & Kulis', url: `${baseUrl}/blog` },
          { name: post.title, url: pageUrl }
        ]} 
      />

      {/* HERO SECTION */}
      <div 
        className="relative h-[45vh] min-h-[320px] w-full flex items-end justify-center pb-8 overflow-hidden"
      >
        {post.imageUrl ? (
          <Image 
            src={post.imageUrl} 
            alt={post.title} 
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--bg-surface-elevated)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-dark)] via-[var(--bg-dark)]/70 to-transparent"></div>
        <div className="relative z-10 text-center px-4 max-w-[900px] mb-8">
          <span className="editorial-tag text-[var(--primary-gold)] inline-block mb-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-[var(--border-subtle)]">
            {post.category}
          </span>
          <h1 className="serif-font text-3xl sm:text-4xl md:text-5xl text-white leading-tight drop-shadow-md">
            {post.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '850px', margin: '-2rem auto 4rem', position: 'relative', zIndex: 10, background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-stage)' }}>
        
        {/* Navigasyon & Yazar Bilgisi */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link href="/blog" className="text-xs font-bold text-[var(--text-dim)] hover:text-[var(--primary-gold)] uppercase tracking-wider flex items-center gap-1.5 transition-colors">
            <ion-icon name="arrow-back-outline"></ion-icon> Tüm Yazılar
          </Link>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            {post.author ? `🖋️ ${post.author}` : 'FSM Tiyatro Ekibi'} • {post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </span>
        </div>

        {/* AKADEMİK ÖZET (ABSTRACT) KUTUSU */}
        {post.academicMeta?.abstract && (
          <div className="mb-8 p-5 bg-[var(--primary-gold-dim)] rounded-xl border border-[var(--primary-gold-border)]">
            <h4 className="text-xs font-bold text-[var(--primary-gold)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <ion-icon name="document-text-outline"></ion-icon>
              Özet / Abstract
            </h4>
            <p className="text-sm text-[var(--text-main)] italic leading-relaxed">
              {post.academicMeta.abstract}
            </p>
            {post.academicMeta.keywords && post.academicMeta.keywords.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--primary-gold-border)] flex flex-wrap gap-2 items-center">
                <span className="text-[11px] font-bold text-[var(--primary-gold)]">Anahtar Kelimeler:</span>
                {post.academicMeta.keywords.map((kw: string, i: number) => (
                  <span key={i} className="text-[11px] bg-[var(--bg-card)] text-[var(--text-muted)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDF TAM METİN BAĞLANTISI (VARSA) */}
        {post.academicMeta?.pdfUrl && (
          <div className="mb-8 p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-xl border border-red-500/20">
                <ion-icon name="document-outline"></ion-icon>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-main)]">Tam Metin PDF Belgesi Mevcut</p>
                <p className="text-[11px] text-[var(--text-dim)]">Akademik araştırma ve arşiv dosyası</p>
              </div>
            </div>
            <a 
              href={post.academicMeta.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <ion-icon name="download-outline"></ion-icon> PDF İndir / İncele
            </a>
          </div>
        )}
        
        {/* MAKALE İÇERİĞİ */}
        <div style={{ fontSize: '1.1rem', lineHeight: '1.85', color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
          {post.content}
        </div>

        {/* AKADEMİK ALINTI ARACI (APA / MLA / BibTeX) */}
        <CitationBox 
          title={post.title}
          author={post.author || 'FSM Tiyatro Ekibi'}
          date={post.createdAt}
          url={pageUrl}
          journal={post.academicMeta?.journalTitle}
          publisher={post.academicMeta?.publisher}
        />

        {/* BEĞENİ & YORUMLAR */}
        <BlogInteractions 
          postId={resolvedParams.id} 
          initialLikes={post.likes || []} 
          initialComments={comments} 
          currentUserEmail={currentUserEmail}
        />
      </div>
    </div>
  );
}
