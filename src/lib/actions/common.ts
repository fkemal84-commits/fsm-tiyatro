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
  const userRole = user.role;

  // SUPERADMIN ve ADMIN her zaman tam yetkilidir
  if (userRole === 'SUPERADMIN' || userRole === 'ADMIN') {
    return { session, user, uid };
  }

  if (allowedRoles.includes(userRole)) {
    return { session, user, uid };
  }

  if (allowedRoles.includes('AKTOR') && userRole === 'PLAYER') {
    return { session, user, uid };
  }

  throw new Error("Bu işlemi yapmaya yetkiniz yok.");
}

/**
 * Firebase Storage'dan dosya siler
 */
export async function deleteStorageFile(publicUrl: string) {
  if (!publicUrl || !publicUrl.includes('storage.googleapis.com')) return;
  try {
    const urlObj = new URL(publicUrl);
    const pathname = decodeURI(urlObj.pathname);
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fsm-tiyatro.firebasestorage.app';

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

import sharp from 'sharp';

/**
 * Firebase Storage'a güvenli dosya yükleme (Sharp optimizasyonu ve Data URI Fallback destekli)
 */
export async function uploadToStorage(file: File, folder: string): Promise<string> {
  const MAX_SIZE = 12 * 1024 * 1024; // 12 MB
  if (file.size > MAX_SIZE) {
    throw new Error("Dosya boyutu çok büyük! Maksimum 12 MB yükleyebilirsiniz.");
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Geçersiz dosya formatı! Sadece JPG, PNG, WEBP ve PDF yükleyebilirsiniz.");
  }

  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  let mimeType = file.type;

  // Görselleri Sharp ile otomatik akıllı optimize et (WebP formatı ve klasöre özel boyutlandırma)
  if (file.type.startsWith('image/')) {
    try {
      let transformer = sharp(buffer);

      if (folder.startsWith('avatars')) {
        // Profil fotoğrafları: 500x500 kare kırpma (~20-35 KB)
        transformer = transformer
          .resize({ width: 500, height: 500, fit: 'cover', position: 'center' })
          .webp({ quality: 80, effort: 4 });
      } else if (folder.includes('posters')) {
        // Oyun Afişleri: 1000x1500 dikey oran (~80-140 KB)
        transformer = transformer
          .resize({ width: 1000, height: 1500, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 });
      } else if (folder.startsWith('posts') || folder.startsWith('plays')) {
        // Blog yazıları ve oyun görselleri: 1600x900 (~100-200 KB)
        transformer = transformer
          .resize({ width: 1600, height: 900, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 });
      } else {
        // Hero ve genel görseller: max 1920x1080 (~180-280 KB)
        transformer = transformer
          .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 });
      }

      buffer = await transformer.toBuffer();
      mimeType = 'image/webp';
    } catch (err) {
      console.warn("[UPLOAD] Sharp optimizasyon uyarısı, orijinal dosya kullanılacak:", err);
    }
  }

  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const rawBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '').replace(/\.[^/.]+$/, "");
  const safeName = rawBaseName + (mimeType === 'image/webp' ? '.webp' : '');
  const filename = `${folder}/${uniquePrefix}-${safeName}`;

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fsm-tiyatro.firebasestorage.app';

  // 1. Firebase Storage'a yüklemeyi dene
  try {
    const bucket = adminStorage.bucket(bucketName);
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000'
      }
    });

    try {
      await fileRef.makePublic();
    } catch {
      // UBLA aktifse makePublic yoksayılır
    }

    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filename)}?alt=media`;
  } catch (storageErr: any) {
    console.warn(`[UPLOAD] Firebase Storage yüklemesi başarısız (${storageErr.message || storageErr}), doğrudan güvenli Base64 Data URI olarak kaydediliyor.`);
    // Storage kapalı/billing pasifse direkt Data URI olarak döndür
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}
