'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// --- YARDIMCI FONKSİYONLAR & GÜVENLİK ---

/**
 * Kullanıcı oturumunu ve yetkisini doğrular. 
 * Revalidation yaparak stale session (bayat oturum) saldırılarını engeller.
 */
async function requireAuth(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Yetkisiz erişim! Lütfen giriş yapın.");

  let role = (session.user as any).role;
  const uSnap = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
  if (uSnap.empty) throw new Error("Kullanıcı kaydı bulunamadı.");
  
  role = uSnap.docs[0].data().role;
  if (!allowedRoles.includes(role)) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }
  return session;
}

/**
 * Firebase Storage'dan dosya imha eder (KVKK & Temizlik)
 */
async function deleteStorageFile(publicUrl: string) {
  if (!publicUrl || !publicUrl.includes('storage.googleapis.com')) return;
  try {
    const urlObj = new URL(publicUrl);
    const pathname = decodeURI(urlObj.pathname);
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    
    // Path format: /bucket-name/folder/filename
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

// Firebase Storage Yükleme Yardımcısı (Güvenlikli)
async function uploadToStorage(file: File, folder: string) {
  console.log(`[STORAGE] Sisteme dosya yükleniyor: ${file.name} (${file.size} bytes, ${file.type})`);

  // 1. Dosya Boyutu Kontrolü (Maksimum 2MB)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    console.error(`[STORAGE] Hata: Dosya boyutu limitin üzerinde! (${file.size} > ${MAX_SIZE})`);
    throw new Error("Dosya boyutu çok büyük! Maksimum 2 MB yükleyebilirsiniz.");
  }

  // 2. Dosya Formatı Kontrolü (JPG, PNG, WEBP)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    console.error(`[STORAGE] Hata: Geçersiz format! (${file.type})`);
    throw new Error("Geçersiz dosya formatı! Sadece JPG, PNG ve WEBP yükleyebilirsiniz.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  const filename = `${folder}/${uniquePrefix}-${safeName}`;
  
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  console.log(`[STORAGE] Hedef Yol: ${filename}, Bucket: ${bucketName || 'Varsayılan'}`);

  const bucket = adminStorage.bucket(bucketName);
  const fileRef = bucket.file(filename);

  try {
    await fileRef.save(buffer, {
      metadata: { 
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // 3. Dosyayı public hale getirmeyi dene (Hata alırsa bucket seviyesinde yetki beklenir)
    try {
      await fileRef.makePublic();
    } catch (e: any) {
      console.warn(`[STORAGE] makePublic() uyarısı (Uniform Access açık olabilir): ${e.message}`);
    }
    
    // 4. URL Oluşturma: Hem Cloud Storage hem Firebase formatını desteklemek için
    // Eğer bucket ismi varsa manuel oluşturmak bazen daha güvenlidir
    let publicUrl = "";
    if (bucketName) {
      publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    } else {
      publicUrl = fileRef.publicUrl();
    }
    
    console.log(`[STORAGE] Yükleme başarılı! URL: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("[STORAGE] Firebase kayıt hatası:", error.message);
    throw new Error("Görsel yüklenirken sunucu hatası oluştu: " + error.message);
  }
}

export async function addPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const imageFile = formData.get('image') as File;
  
  const category = (formData.get('category') as string) || 'KULİS';
  
  if (!title || !content) return;

  let imageUrl = '/default-cover.svg';
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadToStorage(imageFile, 'blog_images');
    } catch (error: any) {
      console.error("Blog resim yükleme hatası:", error);
      // Hata olduğunda durmuyoruz ama logluyoruz. 
      // İleride UI'da toast göstermek için error state eklenebilir.
    }
  }

  await requireAuth(['SUPERADMIN', 'ADMIN', 'EDITOR']);
  const session = await getServerSession(authOptions);

  const authorName = session?.user?.name || 'Anonim';
  const authorEmail = session?.user?.email || '';

  await adminDb.collection('posts').add({
    title,
    content,
    category,
    author: authorName,
    authorEmail,
    imageUrl,
    createdAt: new Date().toISOString()
  });

  revalidatePath('/blog');
  redirect('/blog');
}

export async function addPlay(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const year = formData.get('year') as string;
  const posterFile = formData.get('poster') as File;
  const videoUrl = formData.get('videoUrl') as string;

  if (!title || !description || !year) return;

  let imageUrl = '/default-cover.svg';
  if (posterFile && posterFile.size > 0) {
    try {
      imageUrl = await uploadToStorage(posterFile, 'play_posters');
    } catch (error) {
      console.error("Oyun afiş yükleme hatası:", error);
    }
  }
  await requireAuth(['SUPERADMIN', 'ADMIN']);

  await adminDb.collection('plays').add({
    title,
    description,
    year,
    imageUrl,
    videoUrl: videoUrl || '',
    createdAt: new Date().toISOString()
  });

  revalidatePath('/plays');
  redirect('/plays');
}

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string;
  const surname = formData.get('surname') as string;
  const email = formData.get('email') as string;
  const countryCode = formData.get('countryCode') as string;
  const rawPhone = formData.get('phone') as string;
  const password = formData.get('password') as string;
  const consent = formData.get('consent') ? true : false;

  if (!email || !password || !rawPhone) return { error: "Tüm alanlar zorunludur." };
  
  // Telefon doğrulama (Sadece rakam ve 10 hane)
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(rawPhone)) {
    return { error: "Lütfen geçerli bir telefon numarası giriniz (10 hane, başında 0 olmadan)." };
  }

  const phone = `${countryCode}${rawPhone}`;

  const existingUsers = await adminDb.collection('users').where('email', '==', email).limit(1).get();
  if (!existingUsers.empty) return { error: "Bu e-posta adresiyle zaten kayıt olunmuş." };

  const hashedPassword = await bcrypt.hash(password, 10);

  // OKUL MAİLİ KONTROLÜ (stu.fsm.edu.tr)
  const isSchoolEmail = email.toLowerCase().endsWith('@stu.fsm.edu.tr');
  const role = isSchoolEmail ? 'MEMBER' : 'PENDING';

  await adminDb.collection('users').add({
    name,
    surname,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    consent,
    role,
    createdAt: new Date().toISOString()
  });

  return { success: true, pending: !isSchoolEmail };
}

export async function approveUser(formData: FormData) {
  const userId = formData.get('userId') as string;
  if (!userId) return;

  await requireAuth(['SUPERADMIN', 'ADMIN']);

  await adminDb.collection('users').doc(userId).update({
    role: 'MEMBER'
  });

  revalidatePath('/tanerabi/dashboard');
}

export async function changePassword(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const newPasswordConfirm = formData.get('newPasswordConfirm') as string;

  if (newPassword !== newPasswordConfirm) return { error: "Yazdığınız yeni şifreler eşleşmiyor!" };
  if (newPassword.length < 6) return { error: "Girdiğiniz yeni şifre en az 6 karakter olmalıdır." };

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Yetki reddedildi. Tekrar giriş yapın." };

  const querySnapshot = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
  if (querySnapshot.empty) return { error: "Kullanıcı kaydı bulunamadı." };

  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();

  const isPasswordValid = await bcrypt.compare(currentPassword, userData.password);
  if (!isPasswordValid) return { error: "Girdiğiniz mevcut şifreniz yanlış." };

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userDoc.ref.update({ password: hashedPassword });

  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const photoUrl = formData.get('photoUrl') as string;
  const department = formData.get('department') as string;
  const hobbies = formData.get('hobbies') as string;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Yetkisiz erişim." };

  const querySnapshot = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
  if (!querySnapshot.empty) {
      await querySnapshot.docs[0].ref.update({
          ...(photoUrl ? { photoUrl } : {}),
          ...(department ? { department } : {}),
          ...(hobbies ? { hobbies } : {})
      });
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function addRehearsal(formData: FormData) {
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const location = formData.get('location') as string;
  const notes = formData.get('notes') as string;

  if (!title || !date || !location) return;

  await requireAuth(['SUPERADMIN', 'ADMIN']);

  await adminDb.collection('rehearsals').add({ 
      title, 
      date, 
      location, 
      notes,
      createdAt: new Date().toISOString()
  });
  revalidatePath('/members');
}

export async function addTeamNeed(formData: FormData) {
  const roleName = formData.get('roleName') as string;
  const description = formData.get('description') as string;

  if (!roleName || !description) return;

  await requireAuth(['SUPERADMIN', 'ADMIN']);

  await adminDb.collection('teamNeeds').add({ 
      roleName, 
      description, 
      isActive: true,
      createdAt: new Date().toISOString()
  });
  revalidatePath('/members');
}

export async function changeUserRole(formData: FormData) {
  const targetUserId = formData.get('userId') as string;
  const newRole = formData.get('newRole') as string;

  if (!targetUserId || !newRole) return;

  const session = await requireAuth(['SUPERADMIN', 'ADMIN']);
  const currentUserRole = (session.user as any).role;

  const targetDoc = await adminDb.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) return;

  const targetRole = targetDoc.data()?.role;

  // Güvenlik Kalkanı 2: Normal Admin Sınırları
  if (currentUserRole === 'ADMIN') {
    if (targetRole === 'SUPERADMIN' || targetRole === 'ADMIN') return;
    if (newRole === 'SUPERADMIN' || newRole === 'ADMIN') return;
  }

  // Güvenlik Kalkanı 3: Mutlak Superadmin Koruması
  if (targetRole === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') return;

  await targetDoc.ref.update({ role: newRole });

  revalidatePath('/tanerabi/dashboard');
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { error: "Yüklenecek dijital veri tespiti başarısız." };

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Yetki ihlali." };

  try {
    const folder = `avatars/${session.user.email.replace(/[@.]/g, '_')}`;
    const publicUrl = await uploadToStorage(file, folder);

    const querySnapshot = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
    if (!querySnapshot.empty) {
        await querySnapshot.docs[0].ref.update({ photoUrl: publicUrl });
    }

    revalidatePath('/profile');
    return { success: true, photoUrl: publicUrl };
  } catch (error: any) {
    console.error("Avatar yükleme hatası:", error);
    return { error: error.message || "Bulut sunucusu (Firebase) resmi reddetti." };
  }
}

// KVKK Madde 7: Hard Delete (Unutulma Hakkı) ve Yazar Yıkımı
export async function deleteUserRecord(formData: FormData) {
  const targetUserId = formData.get('userId') as string;
  if (!targetUserId) return;

  const session = await requireAuth(['SUPERADMIN', 'ADMIN']);
  const currentUserRole = (session.user as any).role;

  const targetDoc = await adminDb.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) return;

  const targetData = targetDoc.data()!;
  const targetRole = targetData.role;

  // Adminler diğer adminleri silemez
  if (currentUserRole === 'ADMIN' && (targetRole === 'SUPERADMIN' || targetRole === 'ADMIN')) return;
  // Superadmin harici kimse Superadmin silemez
  if (targetRole === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') return;

  // Firebase Bulut Deposundaki (Storage) Fotoğraf Dosyasını Uzaktan İmha Etme (Zero-Out)
  if (targetData.photoUrl) {
    await deleteStorageFile(targetData.photoUrl);
  }

  // Firestore Veritabanından Kullanıcıyı Sil
  await targetDoc.ref.delete();
  
  revalidatePath('/tanerabi/dashboard');
  redirect('/tanerabi/dashboard');
}

export async function deletePost(formData: FormData) {
  const postId = formData.get('postId') as string;
  if (!postId) return;

  const session = await requireAuth(['SUPERADMIN', 'ADMIN', 'EDITOR']);
  const role = (session.user as any).role;

  const postRef = adminDb.collection('posts').doc(postId);
  const postDoc = await postRef.get();
  
  if (!postDoc.exists) return;
  const postData = postDoc.data();

  // Güvenlik Kalkanı: Editör sadece kendi yazdığı yazıyı silebilir.
  if (role === 'EDITOR' && postData?.authorEmail !== session.user?.email) {
    return;
  }

  // Asset Cleanup
  if (postData?.imageUrl) {
    await deleteStorageFile(postData.imageUrl);
  }

  await postRef.delete();
  revalidatePath('/blog');
  revalidatePath('/tanerabi/dashboard');
}

export async function deletePlay(formData: FormData) {
  const playId = formData.get('playId') as string;
  if (!playId) return;

  await requireAuth(['SUPERADMIN', 'ADMIN']);

  const playRef = adminDb.collection('plays').doc(playId);
  const playDoc = await playRef.get();
  if (playDoc.exists && playDoc.data()?.imageUrl) {
    await deleteStorageFile(playDoc.data()?.imageUrl);
  }

  await playRef.delete();
  revalidatePath('/plays');
  revalidatePath('/tanerabi/dashboard');
}
