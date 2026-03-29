import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from 'next/link';
import { deleteUserRecord } from '@/app/actions';

export default async function AdminUserProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/login');
  
  const currentUserRole = (session.user as any).role;
  // Sadece Superadmin veya Admin bu "Özel Profil İnceleme" sayfasına erişebilir.
  if (currentUserRole !== 'SUPERADMIN' && currentUserRole !== 'ADMIN') {
    redirect('/');
  }

  const docSnap = await adminDb.collection('users').doc(resolvedParams.id).get();
  if (!docSnap.exists) notFound();
  const userRecord = { id: docSnap.id, ...(docSnap.data() as any) };
  userRecord.createdAt = userRecord.createdAt ? new Date(userRecord.createdAt) : new Date();

  const defaultAvatar = "/default-avatar.svg";

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
           <Link href="/tanerabi/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
              &larr; Yönetim Paneline Geri Dön
           </Link>
        </div>

        <div className="glass-card" style={{ padding: '3rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
            
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--primary-gold)', overflow: 'hidden', flexShrink: 0 }}>
              <img src={userRecord.photoUrl || defaultAvatar} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <h1 className="serif-font" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.5rem', lineHeight: '1' }}>{userRecord.name} {userRecord.surname}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1.1rem' }}>{userRecord.email} • {userRecord.phone || 'Telefon Yok'}</p>
              <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', background: 'rgba(212,175,55,0.15)', color: 'var(--primary-gold)', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '1px' }}>
                SİSTEM YETKİSİ: {userRecord.role === 'EDITOR' ? 'İÇERİK EDİTÖRÜ' : userRecord.role}
              </div>
            </div>
            
          </div>

          <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem' }}>Detaylı Kulüp Verisi</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Akademik Bölümü</span>
              <p style={{ color: 'var(--primary-gold)', fontSize: '1.1rem', fontWeight: 600 }}>{userRecord.department || 'Henüz belirtilmemiş.'}</p>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Kayıt Tarihi</span>
              <p style={{ color: '#fff', fontSize: '1.1rem' }}>{userRecord.createdAt.toLocaleDateString('tr-TR')} - {userRecord.createdAt.toLocaleTimeString('tr-TR')}</p>
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hobiler ve Sahne Geçmişi</span>
              <p style={{ color: '#fff', fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {userRecord.hobbies || 'Bu kişi için sisteme herhangi bir biyografi veya sahne geçmişi yüklenmemiş.'}
              </p>
            </div>
          </div>

          {(currentUserRole === 'SUPERADMIN' || (currentUserRole === 'ADMIN' && (userRecord as any).role !== 'SUPERADMIN' && (userRecord as any).role !== 'ADMIN')) && (
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px dashed rgba(255,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ color: '#ff4d4d', fontSize: '1.1rem', marginBottom: '0.5rem' }}>⚠️ KVKK Yıkım Paneli (Right to be Forgotten)</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center', maxWidth: '500px' }}>Bu işlem geri alınamaz. Kullanıcının SQL kaydını ve fiziksel diskteki fotoğrafını (fs.unlink) kalıcı olarak sıfırlayıp silecektir.</p>
              <form action={async (fd) => { await deleteUserRecord(fd); }}>
                <input type="hidden" name="userId" value={userRecord.id} />
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ padding: '0.8rem 2rem', background: 'rgba(139,0,0,0.4)', color: '#ff4d4d', fontWeight: 'bold', borderRadius: '8px', border: '1px solid #ff4d4d', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  🔴 Kaydı ve Verilerini Sistemden İmha Et
                </button>
              </form>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
