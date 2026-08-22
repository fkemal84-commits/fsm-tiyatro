import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Kullanıcı oturumunu ve yetkisini doğrular. 
 * Revalidation yaparak stale session (bayat oturum) saldırılarını engeller.
 */
export async function requireAuth(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Yetkisiz erişim! Lütfen giriş yapın.");

  const uSnap = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
  if (uSnap.empty) throw new Error("Kullanıcı kaydı bulunamadı.");

  const user = uSnap.docs[0].data();
  const uid = uSnap.docs[0].id;

  const isAdminAction = allowedRoles.some(role => ['ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(role));
  const isAdminMode = (session.user as any)?.isAdminMode === true;

  if (isAdminAction && !isAdminMode) {
    throw new Error("Bu işlem için yönetici modunda giriş yapmalısınız.");
  }

  if (!allowedRoles.includes(user.role)) {
    if (allowedRoles.includes('AKTOR') && user.role === 'PLAYER') {
      // Geçerli
    } else {
      throw new Error("Bu işlemi yapmaya yetkiniz yok.");
    }
  }

  return { session, user, uid };
}

/**
 * Firebase Storage'dan dosya siler
 */
export async function deleteStorageFile(publicUrl: string) {
  if (!publicUrl || !publicUrl.includes('storage.googleapis.com')) return;
  try {
    const urlObj = new URL(publicUrl);
    const pathname = decodeURI(urlObj.pathname);
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    const pathParts = pathname.split('/');
    const bucketIndex = pathParts.findIndex(p => p === bucketName);
    const filePath = bucketIndex !== -1 ? pathParts.slice(bucketIndex + 1).join('/') : pathname;

    if (filePath) {
      await adminStorage.bucket(bucketName).file(filePath).delete().catch(err => {
        if (err.code !== 404) console.error(`[CLEANUP] Dosya silinemedi (${filePath}):`, err.message);
      });
    }
  } catch (err) {
    console.error("[CLEANUP] URL ayrıştırma hatası:", err);
  }
}

/**
 * Firebase Storage'a güvenli dosya yükleme
 */
export async function uploadToStorage(file: File, folder: string) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) {
    throw new Error("Dosya boyutu çok büyük! Maksimum 5 MB yükleyebilirsiniz.");
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Geçersiz dosya formatı! Sadece JPG, PNG, WEBP ve PDF yükleyebilirsiniz.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  const filename = `${folder}/${uniquePrefix}-${safeName}`;

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const bucket = adminStorage.bucket(bucketName);
  const fileRef = bucket.file(filename);

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000'
    }
  });

  try {
    await fileRef.makePublic();
  } catch (e: any) {
    // ignore if already public
  }

  if (bucketName) {
    return `https://storage.googleapis.com/${bucketName}/${filename}`;
  } else {
    return fileRef.publicUrl();
  }
}
