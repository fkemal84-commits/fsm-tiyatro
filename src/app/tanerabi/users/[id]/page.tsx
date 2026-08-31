import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from 'next/link';
import { deleteUserRecord, adminUpdateUserEmail } from '@/app/actions';
import UserPlaysManager from '@/components/UserPlaysManager';

export const dynamic = "force-dynamic";

export default async function AdminUserProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) redirect('/login');
  
  const currentUserRole = (session.user as any).role;
  const isAdminMode = (session.user as any).isAdminMode;

  const allowedRoles = ['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR'];
  if (!allowedRoles.includes(currentUserRole) || !isAdminMode) {
    redirect('/');
  }

  const docSnap = await adminDb.collection('users').doc(resolvedParams.id).get();
  if (!docSnap.exists) notFound();
  const data = docSnap.data()!;

  const rawName = data.name || '';
  const rawSurname = data.surname || '';
  const cleanName = rawName.replace(/undefined/gi, '').trim();
  const cleanSurname = rawSurname.replace(/undefined/gi, '').trim();
  const fullName = [cleanName, cleanSurname].filter(Boolean).join(' ') || 'Kulüp Üyesi';

  const userRecord = { 
    id: docSnap.id, 
    name: cleanName,
    surname: cleanSurname,
    fullName,
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

  const playsSnap = await adminDb.collection('plays').get();
  const allPlays = playsSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));

  const defaultAvatar = "/default-avatar.svg";

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Süper Admin',
    ADMIN: 'Admin',
    DIRECTOR: 'Yönetmen',
    ASST_DIRECTOR: 'Yrd. Yönetmen',
    AKTOR: 'Aktör',
    PLAYER: 'Aktör',
    EDITOR: 'İçerik Editörü',
    SALES: 'Satış',
    MEMBER: 'Üye',
  };

  return (
    <div style={{ padding: '8rem 5% 4rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
           <Link href="/tanerabi/dashboard?tab=members" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
              &larr; Yönetim Paneline Geri Dön
           </Link>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '20px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2rem' }}>
            
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid var(--primary-gold)', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-subtle)' }}>
              <img src={userRecord.photoUrl || defaultAvatar} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <h1 className="serif-font" style={{ fontSize: '2.2rem', color: 'var(--text-main)', margin: '0 0 0.4rem 0', lineHeight: '1.2' }}>{userRecord.fullName}</h1>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 0.8rem 0', fontSize: '0.95rem' }}>{userRecord.email} • {userRecord.phone || 'Telefon Yok'}</p>
              <div style={{ display: 'inline-block', padding: '0.3rem 1rem', background: 'var(--primary-gold-dim)', color: 'var(--primary-gold)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid var(--primary-gold-border)' }}>
                {roleLabels[userRecord.role] || userRecord.role}
              </div>
            </div>
          </div>

          {/* OYUN ATAMA PANELİ */}
          <UserPlaysManager 
            userId={userRecord.id} 
            allPlays={allPlays} 
            initialAssigned={userRecord.assignedPlays} 
          />

          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '2.5rem 0 1rem 0', fontWeight: 'bold' }}>Detaylı Üye Bilgileri</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akademik Bölümü</span>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>{userRecord.department || 'Belirtilmemiş.'}</p>
            </div>
            
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kayıt Tarihi</span>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0 }}>{userRecord.createdAt.toLocaleDateString('tr-TR')}</p>
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Özel Yetenekler</span>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0 }}>{userRecord.skills || 'Belirtilmemiş.'}</p>
            </div>

            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Biyografi & Sahne Tecrübesi</span>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
                {userRecord.bio || 'Bu üye için henüz biyografi eklenmemiş.'}
              </p>
            </div>
          </div>

          {(currentUserRole === 'SUPERADMIN' || currentUserRole === 'ADMIN') && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
              <h4 style={{ color: 'var(--primary-gold)', fontSize: '0.95rem', margin: '0 0 0.35rem 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ion-icon name="mail-outline" /> E-Posta Adresini Düzelt (Admin Müdahalesi)
              </h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '0 0 1rem 0' }}>
                Kullanıcı kaydolurken yazım hatası yaptıysa veya e-postasının güncellenmesi gerekiyorsa buradan doğrudan düzeltebilirsiniz.
              </p>
              <form action={adminUpdateUserEmail as any} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="hidden" name="userId" value={userRecord.id} />
                <input 
                  type="email" 
                  name="newEmail" 
                  defaultValue={userRecord.email} 
                  required 
                  style={{ flex: '1', minWidth: '240px', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'var(--bg-dark)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', fontSize: '0.85rem' }} 
                />
                <button 
                  type="submit" 
                  style={{ padding: '0.5rem 1.25rem', background: 'var(--primary-gold)', color: '#000', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  E-Postayı Güncelle
                </button>
              </form>
            </div>
          )}

          {(currentUserRole === 'SUPERADMIN' || currentUserRole === 'ADMIN') && (
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px dashed rgba(239,68,68,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0 0 0.35rem 0', fontWeight: 'bold' }}>Hesap Yönetimi</h4>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '0 0 1.25rem 0', textAlign: 'center' }}>Bu kullanıcıyı ve tüm verilerini sistemden kalıcı olarak siler.</p>
              <form action={deleteUserRecord as any}>
                <input type="hidden" name="userId" value={userRecord.id} />
                <button 
                  type="submit" 
                  style={{ padding: '0.65rem 1.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 'bold', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Kullanıcıyı Kalıcı Olarak Sil
                </button>
              </form>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
