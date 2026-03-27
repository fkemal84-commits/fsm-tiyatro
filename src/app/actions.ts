'use server';

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Firebase Storage Yükleme Yardımcısı (Güvenlikli)
async function uploadToStorage(file: File, folder: string) {
  // 1. Dosya Boyutu Kontrolü (Maksimum 2MB)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("Dosya boyutu çok büyük! Maksimum 2 MB yükleyebilirsiniz.");
  }

  // 2. Dosya Formatı Kontrolü (JPG, PNG, WEBP)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Geçersiz dosya formatı! Sadece JPG, PNG ve WEBP yükleyebilirsiniz.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  const filename = `${folder}/${uniquePrefix}-${safeName}`;
  
  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(filename);

  await fileRef.save(buffer, {
    metadata: { contentType: file.type },
    public: true 
  });
  
  return fileRef.publicUrl();
}

export async function addPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const imageFile = formData.get('image') as File;
  
  if (!title || !content) return;

  let imageUrl = '/default-cover.svg';
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadToStorage(imageFile, 'blog_images');
    } catch (error) {
      console.error("Blog resim yükleme hatası:", error);
    }
  }

  const session = await getServerSession(authOptions);
  let role = (session?.user as any)?.role;

  // Canlı Rol Senkronizasyonu: Session bayatlamış olabilir, DB'den teyit alıyoruz
  if (session?.user?.email) {
    const uSnap = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
    if (!uSnap.empty) {
      role = uSnap.docs[0].data().role;
    }
  }

  if (role !== 'SUPERADMIN' && role !== 'ADMIN' && role !== 'EDITOR') return;

  const authorName = session?.user?.name || 'Anonim';

  await adminDb.collection('posts').add({
    title,
    content,
    category: 'KULİS',
    author: authorName,
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
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;
  const consent = formData.get('consent') ? true : false;

  if (!email || !password) return { error: "Email ve şifre zorunludur." };
  
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

  const session = await getServerSession(authOptions);
  const currentUserRole = (session?.user as any)?.role;
  if (currentUserRole !== 'SUPERADMIN' && currentUserRole !== 'ADMIN') return;

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

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return;

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

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return;

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

  const session = await getServerSession(authOptions);
  const currentUserRole = (session?.user as any)?.role;

  // Güvenlik Kalkanı 1: Yalnızca yöneticiler yetki komutu gönderebilir
  if (currentUserRole !== 'SUPERADMIN' && currentUserRole !== 'ADMIN') return;

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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Firebase Storage için Kusursuz dosya ID üretimi
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `avatars/${session.user.email.replace(/[@.]/g, '_')}/${uniquePrefix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
  
  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(filename);

  try {
      await fileRef.save(buffer, {
        metadata: { contentType: file.type },
        public: true 
      });
  } catch (error) {
      console.error("Firebase Storage Yükleme Hatası:", error);
      return { error: "Bulut sunucusu (Firebase) resmi reddetti. Storage kovası veya API ayarınızı kontrol edin." };
  }
  
  const publicUrl = fileRef.publicUrl();

  const querySnapshot = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
  if (!querySnapshot.empty) {
      await querySnapshot.docs[0].ref.update({ photoUrl: publicUrl });
  }

  revalidatePath('/profile');
  return { success: true, photoUrl: publicUrl };
}

// KVKK Madde 7: Hard Delete (Unutulma Hakkı) ve Yazar Yıkımı
export async function deleteUserRecord(formData: FormData) {
  const targetUserId = formData.get('userId') as string;
  if (!targetUserId) return;

  const session = await getServerSession(authOptions);
  const currentUserRole = (session?.user as any)?.role;

  // Sadece yetkililer imha komutu gönderebilir
  if (currentUserRole !== 'SUPERADMIN' && currentUserRole !== 'ADMIN') return;

  const targetDoc = await adminDb.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) return;

  const targetData = targetDoc.data()!;
  const targetRole = targetData.role;

  // Adminler diğer adminleri silemez
  if (currentUserRole === 'ADMIN' && (targetRole === 'SUPERADMIN' || targetRole === 'ADMIN')) return;
  // Superadmin harici kimse Superadmin silemez
  if (targetRole === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') return;

  // Firebase Bulut Deposundaki (Storage) Fotoğraf Dosyasını Uzaktan İmha Etme (Zero-Out)
  if (targetData.photoUrl && targetData.photoUrl.includes('storage.googleapis.com')) {
    // Extract file path from public URL
    try {
        const urlObj = new URL(targetData.photoUrl);
        const pathname = urlObj.pathname; // /bucket-name/avatars/...
        const parts = pathname.split('/');
        // Assuming publicUrl() format is https://storage.googleapis.com/bucket-name/path/to/file
        // We need 'path/to/file'
        const bucketMatchIndex = parts.findIndex(p => p === process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        let filenamePaths = "";
        if (bucketMatchIndex !== -1) {
             filenamePaths = parts.slice(bucketMatchIndex + 1).join('/');
        } else {
             // fallback parsing
             const avatarsIndex = parts.indexOf('avatars');
             if(avatarsIndex !== -1) {
                 filenamePaths = parts.slice(avatarsIndex).join('/');
             }
        }

        if (filenamePaths) {
          const fileRef = adminStorage.bucket().file(decodeURI(filenamePaths));
          await fileRef.delete().catch(err => {
              if(err.code !== 404) console.error("Bulut imhası (Firebase Storage) hata verdi: ", err);
          });
        }
    } catch(err) {
        console.error("URL parse error: ", err);
    }
  }

  // Firestore Veritabanından Kullanıcıyı Sil
  await targetDoc.ref.delete();
  
  revalidatePath('/tanerabi/dashboard');
  redirect('/tanerabi/dashboard');
}

export async function deletePost(formData: FormData) {
  const postId = formData.get('postId') as string;
  if (!postId) return;

  const session = await getServerSession(authOptions);
  let role = (session?.user as any)?.role;

  // Canlı Rol Senkronizasyonu (Stale Session Koruması)
  if (session?.user?.email) {
    const uSnap = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
    if (!uSnap.empty) {
      role = uSnap.docs[0].data().role;
    }
  }

  if (role !== 'ADMIN' && role !== 'SUPERADMIN' && role !== 'EDITOR') return;

  await adminDb.collection('posts').doc(postId).delete();
  revalidatePath('/blog');
  revalidatePath('/tanerabi/dashboard');
}

export async function deletePlay(formData: FormData) {
  const playId = formData.get('playId') as string;
  if (!playId) return;

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') return;

  await adminDb.collection('plays').doc(playId).delete();
  revalidatePath('/plays');
  revalidatePath('/tanerabi/dashboard');
}
