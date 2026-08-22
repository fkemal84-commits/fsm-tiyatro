import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h1 className="serif-font text-6xl text-[var(--primary-gold)] mb-4">404</h1>
      <p className="text-[var(--text-muted)] text-lg mb-8">Aradığınız sayfa sahnede bulunamadı.</p>
      <Link href="/" className="btn btn-primary">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
