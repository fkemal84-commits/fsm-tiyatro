import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from 'next/link';
import { deleteUserRecord } from '@/app/actions';
import UserPlaysManager from '@/components/UserPlaysManager';

export default async function AdminUserProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/login');
  
  const currentUserRole = (session.user as any).role;
  const isAdminMode = (session.user as any).isAdminMode;

  // Yetki Kontrolü: Adminler, Yönetmenler ve Yardımcıları (Marabalar) girebilir.
  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'];
  if (!allowedRoles.includes(currentUserRole) || !isAdminMode) {
    redirect('/');
  }

  const docSnap = await adminDb.collection('users').doc(resolvedParams.id).get();
  if (!docSnap.exists) notFound();
  const data = docSnap.data()!;
  const userRecord = { 
    id: docSnap.id, 
    name: data.name,
    surname: data.surname,
    email: data.email,
    role: data.role,
    phone: data.phone || '',
    photoUrl: data.photoUrl || '',
    department: data.department || '',
    hobbies: data.hobbies || '',
    pastPlays: data.pastPlays || '',
    skills: data.skills || '',
    bio: data.bio || '',
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    assignedPlays: (data.assignedPlays as string[]) || []
  };

  // Tüm oyunlar listesini çek (Atama işlemi için)
  const playsSnap = await adminDb.collection('plays').get();
  const allPlays = playsSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));

  const defaultAvatar = "/default-avatar.svg";

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
           <Link href="/tanerabi/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
              &larr; Yönetim Paneline Geri Dön
           </Link>
        </div>

        <div className="glass-card" style={{ padding: '3rem', borderRadius: '24px', border: 'var(--glass-border)', background: 'rgba(5,5,5,0.95)' }}>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
            
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--primary-gold)', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 30px rgba(212,175,55,0.1)' }}>
              <img src={userRecord.photoUrl || defaultAvatar} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <h1 className="serif-font" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '0.5rem', lineHeight: '1', letterSpacing: '-0.02em' }}>{userRecord.name} {userRecord.surname}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '1.1rem' }}>{userRecord.email} • {userRecord.phone || 'Telefon Yok'}</p>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.4rem', background: 'rgba(212,175,55,0.1)', color: 'var(--primary-gold)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px', border: '1px solid rgba(212,175,55,0.2)' }}>
                {userRecord.role === 'PLAYER' || userRecord.role === 'AKTOR' ? 'SAHNE: AKTÖR 🎭' : 
                 userRecord.role === 'DIRECTOR' ? 'REJİ: YÖNETMEN 🎬' : 
                 userRecord.role === 'ASST_DIRECTOR' ? 'REJİ: YRD. YÖNETMEN' : 
                 userRecord.role === 'ADMIN' ? 'SİSTEM YETKİSİ: ADM' : userRecord.role}
              </div>
            </div>
          </div>

          {/* OYUN ATAMA PANELİ (SADECE YÖNETİCİLER GÖREBİLİR) */}
          <UserPlaysManager 
            userId={userRecord.id} 
            allPlays={allPlays} 
            initialAssigned={userRecord.assignedPlays} 
          />

          <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem', marginTop: '3rem' }}>Detaylı Üye Verisi</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Akademik Bölümü</span>
              <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{userRecord.department || 'Henüz belirtilmemiş.'}</p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Kayıt Tarihi</span>
              <p style={{ color: '#fff', fontSize: '1.1rem' }}>{userRecord.createdAt.toLocaleDateString('tr-TR')} - {userRecord.createdAt.toLocaleTimeString('tr-TR')}</p>
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Sahne Geçmişi & Biyografi</span>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                {userRecord.bio || 'Bu kişi için sisteme herhangi bir biyografi veya sahne geçmişi yüklenmemiş.'}
              </p>
            </div>
          </div>

          {(currentUserRole === 'SUPERADMIN' || currentUserRole === 'ADMIN') && (
            <div style={{ marginTop: '4rem', paddingTop: '2.5rem', borderTop: '1px dashed rgba(255,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ color: '#ff4d4d', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>⚠️ Sistem Güvenlik ve Temizlik</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', textAlign: 'center', maxWidth: '500px' }}>KVKK Madde 7 uyarınca kullanıcıyı sistemden tamamen imha eder.</p>
              <form action={deleteUserRecord as any}>
                <input type="hidden" name="userId" value={userRecord.id} />
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ padding: '0.8rem 2.5rem', background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', fontWeight: 'bold', borderRadius: '12px', border: '1px solid rgba(255,77,77,0.3)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem' }}
                >
                  🔴 KALICI OLARAK SİL
                </button>
              </form>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
