'use server';

import { adminDb, adminStorage, adminMessaging } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from 'crypto';
import { headers } from 'next/headers';

// --- YARDIMCI FONKSİYONLAR & GÜVENLİK ---

/**
 * Kullanıcı oturumunu ve yetkisini doğrular. 
 * Revalidation yaparak stale session (bayat oturum) saldırılarını engeller.
 */
async function requireAuth(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Yetkisiz erişim! Lütfen giriş yapın.");

  const uSnap = await adminDb.collection('users').where('email', '==', session.user.email).limit(1).get();
  if (uSnap.empty) throw new Error("Kullanıcı kaydı bulunamadı.");
  
  const user = uSnap.docs[0].data();
  const uid = uSnap.docs[0].id;
  
  // GİZLİ YOL DENETİMİ: Eğer hassas (Admin/Superadmin) bir yetki isteniyorsa, 
  // oturumun mutlaka /tanerabi üzerinden açılmış olması gerekir.
  const isAdminAction = allowedRoles.some(role => ['ADMIN', 'SUPERADMIN', 'DIRECTOR'].includes(role));
  const isAdminMode = (session.user as any)?.isAdminMode === true;

  if (isAdminAction && !isAdminMode) {
      throw new Error("Bu işlem için yönetici modunda (güvenli kanal) giriş yapmalısınız.");
  }

  if (!allowedRoles.includes(user.role)) {
    // Geriye dönük uyumluluk: Eğer izin verilenlerde AKTOR varsa PLAYER'a da izin ver
    if (allowedRoles.includes('AKTOR') && user.role === 'PLAYER') {
      // Geçerli
    } else {
      throw new Error("Bu işlemi yapmaya yetkiniz yok.");
    }
  }
  
  return { session, user, uid };
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

  // 2. Dosya Formatı Kontrolü (JPG, PNG, WEBP, GIF)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
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
    console.log(`[STORAGE] Dosya kaydedildi, public hale getiriliyor...`);
    
    // 3. Dosyayı public hale getirmeyi dene
    try {
      await fileRef.makePublic();
    } catch (e: any) {
      console.warn(`[STORAGE] makePublic() uyarısı: ${e.message}`);
    }
    
    // 4. URL Oluşturma
    let publicUrl = "";
    if (bucketName) {
      publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    } else {
      publicUrl = fileRef.publicUrl();
    }
    
    console.log(`[STORAGE] Yükleme tamamlandı. URL: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("[STORAGE] Firebase kayıt hatası:", error.message);
    throw new Error("Görsel yüklenirken sunucu hatası oluştu: " + error.message);
  }
}

export async function addPost(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const imageFile = formData.get('image') as File;
    const category = (formData.get('category') as string) || 'KULİS';
    
    if (!title || !content) return { error: "Başlık ve içerik gereklidir." };

    let imageUrl = '/default-cover.svg';
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await uploadToStorage(imageFile, 'blog_images');
      } catch (error: any) {
        console.error("Blog resim yükleme hatası:", error);
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
  } catch (error: any) {
    console.error("[ADD_POST] Hata:", error);
    return { error: error.message || "Yazı eklenirken bir hata oluştu." };
  }
  redirect('/blog');
}

export async function addPlay(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const year = formData.get('year') as string;
    const posterFile = formData.get('poster') as File;
    const videoUrl = formData.get('videoUrl') as string;

    if (!title || !description || !year) return { error: "Gerekli alanları doldurun." };

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
  } catch (error: any) {
    console.error("[ADD_PLAY] Hata:", error);
    return { error: error.message || "Oyun eklenirken bir hata oluştu." };
  }
  redirect('/plays');
}

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const email = formData.get('email') as string;
    const countryCode = formData.get('countryCode') as string;
    const rawPhoneWithSpaces = formData.get('phone') as string;
    const rawPhone = rawPhoneWithSpaces.replace(/\s/g, ''); // Boşlukları temizle
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
  } catch (error: any) {
    console.error("[REGISTER] Hata:", error);
    return { error: "Kayıt sırasında teknik bir hata oluştu." };
  }
}

export async function approveUser(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    if (!userId) return { error: "Kullanıcı ID gereklidir." };

    await requireAuth(['SUPERADMIN', 'ADMIN']);

    await adminDb.collection('users').doc(userId).update({
      role: 'MEMBER'
    });

    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[APPROVE_USER] Hata:", error);
    return { error: error.message };
  }
}

export async function changePassword(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const newPasswordConfirm = formData.get('newPasswordConfirm') as string;

  if (newPassword !== newPasswordConfirm) return { error: "Yazdığınız yeni şifreler eşleşmiyor!" };
  if (newPassword.length < 6) return { error: "Girdiğiniz yeni şifre en az 6 karakter olmalıdır." };

  try {
    const { user, uid } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) return { error: "Girdiğiniz mevcut şifreniz yanlış." };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await adminDb.collection('users').doc(uid).update({ password: hashedPassword });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProfile(formData: FormData) {
  const photoUrl = formData.get('photoUrl') as string;
  const department = formData.get('department') as string;
  const hobbies = formData.get('hobbies') as string;
  const pastPlays = formData.get('pastPlays') as string;
  const skills = formData.get('skills') as string;
  const bio = formData.get('bio') as string;

  try {
    const { uid } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    
    await adminDb.collection('users').doc(uid).update({
        ...(photoUrl ? { photoUrl } : {}),
        department: department || '',
        hobbies: hobbies || '',
        pastPlays: pastPlays || '',
        skills: skills || '',
        bio: bio || '',
        updatedAt: new Date().toISOString()
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}


export async function saveFCMToken(token: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.warn("[PUSH] Token kaydedilemedi: Oturum bulunamadı.");
      return { error: "Oturum açmalısınız." };
    }

    const email = session.user.email.toLowerCase();
    
    await adminDb.collection('fcmTokens').doc(token).set({
      email,
      userId: (session.user as any).id || '',
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    console.error("[FCM_TOKEN_SAVE] Hata:", error);
    return { error: error.message };
  }
}

async function sendPushToAll(title: string, body: string, url: string = '/') {
  try {
    const tokensSnap = await adminDb.collection('fcmTokens').get();
    const tokens = tokensSnap.docs.map(doc => doc.id);

    if (tokens.length === 0) return { success: false, error: "Hiç kayıtlı cihaz bulunamadı." };

    // FCM has a limit of 500 tokens per multicast message
    const batches = [];
    for (let i = 0; i < tokens.length; i += 500) {
      batches.push(tokens.slice(i, i + 500));
    }

    let successCount = 0;
    let failureCount = 0;

    for (const batch of batches) {
      const message = {
        notification: { title, body },
        data: { url },
        tokens: batch
      };

      const response = await adminMessaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            // Clean up invalid tokens if needed (optional optimization)
            // console.log(`[PUSH] Inactive token removed: ${batch[idx].substring(0, 10)}`);
          }
        });
      }
    }

    return { success: true, count: successCount, failure: failureCount };
  } catch (error: any) {
    console.error('[PUSH] Kritik gönderim hatası:', error);
    return { error: error.message };
  }
}

// Kendi cihazını test etme
export async function testPushToSelf() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Oturum açmalısınız." };

  const email = session.user.email.toLowerCase();
  
  try {
    const tokensSnap = await adminDb.collection('fcmTokens').where('email', '==', email).get();
    const tokens = tokensSnap.docs.map(doc => doc.id);

    if (tokens.length === 0) return { error: "Cihazınız henüz kayıt edilmemiş. Lütfen bildirim butonuna basın." };

    const message = {
      notification: { 
        title: "🎭 Test Bildirimi", 
        body: "Tebrikler! Bildirim sisteminiz kusursuz çalışıyor." 
      },
      tokens: tokens
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    return { success: true, count: response.successCount };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Prova eklendiğinde bildirim gönder
export async function addRehearsal(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const rehearsalDate = formData.get('rehearsalDate') as string;
    const rehearsalTime = formData.get('rehearsalTime') as string;
    const location = formData.get('location') as string;
    const notes = formData.get('notes') as string;

    if (!title || !rehearsalDate || !rehearsalTime || !location) return { error: "Gerekli alanlar eksik." };

    const dateObj = new Date(rehearsalDate);
    const formattedDate = dateObj.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
    
    const date = `${formattedDate} - Saat: ${rehearsalTime}`;

    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'AKTOR']);

    await adminDb.collection('rehearsals').add({ 
        title, 
        date, 
        location, 
        notes,
        createdAt: new Date().toISOString()
    });

    await sendPushToAll(
      "🎭 Yeni Prova Eklendi!",
      `${title} - ${date} tarihinde ${location} konumunda yapılacak.`,
      '/members/rehearsals'
    );

    revalidatePath('/members');
    return { success: true };
  } catch (error: any) {
    console.error("[ADD_REHEARSAL] Hata:", error);
    return { error: error.message };
  }
}

// Etkinlik eklendiğinde bildirim gönder
export async function addEvent(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const eventDate = formData.get('eventDate') as string;
    const eventTime = formData.get('eventTime') as string;
    const location = formData.get('location') as string;
    const description = formData.get('description') as string;

    if (!title || !eventDate || !eventTime || !location) return { error: "Gerekli alanlar eksik." };

    const dateObj = new Date(eventDate);
    const formattedDate = dateObj.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
    
    const date = `${formattedDate} - Saat: ${eventTime}`;

    await requireAuth(['SUPERADMIN', 'ADMIN']);

    await adminDb.collection('events').add({ 
        title, 
        date, 
        location, 
        description: description || '',
        createdAt: new Date().toISOString()
    });

    await sendPushToAll(
      "📢 Yeni Etkinlik Duyurusu!",
      `${title} - ${date} tarihinde sizi bekliyoruz.`,
      '/members'
    );

    revalidatePath('/members');
    return { success: true };
  } catch (error: any) {
    console.error("[ADD_EVENT] Hata:", error);
    return { error: error.message };
  }
}

// Dürtme bildirimi
export async function nudgePlayers() {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    
    const messages = [
      "🎭 Beyler/Bayanlar, ezberler ne alemde? Reji masasında bekliyoruz! 🎬👀",
      "🎬 Ezber geçmeyen var mı? Akşam provada sahne sizi bekler! 😂🎭",
      "🎭 Ezberler su gibi olsun arkadaşlar. Sahne aşkına! 🌊😂",
      "📢 Bugün ezbersiz gelenlere ceza olarak dekora yardım var! 🎨🎭"
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    const res = await sendPushToAll("🎭 Yönetmen Dürtmesi!", randomMsg, '/members/rehearsals');
    return { success: true, ...res };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Anlık Yoklama Başlat (Hızlı Kayıt)
export async function startInstantAttendance(formData?: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const title = `Anlık Yoklama - ${dateStr}`;

    const docRef = await adminDb.collection('rehearsals').add({
        title,
        date: `${dateStr} - Saat: ${timeStr} (Anlık)`,
        location: 'Sahne / Salon',
        notes: 'Bu kayıt yönetim panelinden anlık olarak başlatılmıştır.',
        attendance: [],
        createdAt: now.toISOString()
    });

    revalidatePath('/members/rehearsals');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("[INSTANT_ATTENDANCE] Hata:", error);
    return { error: error.message };
  }
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

  try {
    const { user, uid } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    
    const email = user.email.toLowerCase();
    const folder = `avatars/${email.replace(/[@.]/g, '_')}`;
    console.log(`[AVATAR] ${email} için avatar yüklemesi başlatıldı...`);
    
    const publicUrl = await uploadToStorage(file, folder);

    await adminDb.collection('users').doc(uid).update({ photoUrl: publicUrl });
    console.log(`[AVATAR] Kullanıcı dökümanı güncellendi: ${publicUrl}`);

    revalidatePath('/profile');
    revalidatePath('/tanerabi/dashboard');
    return { success: true, photoUrl: publicUrl };
  } catch (error: any) {
    console.error("[AVATAR] Kritik hata:", error);
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

export async function joinEvent(formData: FormData) {
  const eventId = formData.get('eventId') as string;
  const eventTitle = formData.get('eventTitle') as string;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Giriş yapmalısınız." };

  await adminDb.collection('eventRequests').add({
    eventId,
    eventTitle,
    userId: (session.user as any).id || '',
    userName: session.user.name || 'İsimsiz Üye',
    userEmail: session.user.email,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });

  return { success: true };
}

export async function deleteEvent(formData: FormData) {
  const eventId = formData.get('eventId') as string;
  if (!eventId) return;

  await requireAuth(['SUPERADMIN', 'ADMIN']);
  await adminDb.collection('events').doc(eventId).delete();

  revalidatePath('/members');
  revalidatePath('/tanerabi/dashboard');
}

export async function deleteRehearsal(formData: FormData) {
  const rehearsalId = formData.get('rehearsalId') as string;
  if (!rehearsalId) return;

  await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'AKTOR']);
  await adminDb.collection('rehearsals').doc(rehearsalId).delete();

  revalidatePath('/members/rehearsals');
}

// --- EKOSİSTEM GENİŞLEME AKSİYONLARI ---

export async function uploadScript(formData: FormData) {
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const playId = formData.get('playId') as string;

  if (!file || !title) return { error: "Dosya ve başlık zorunludur." };
  if (file.size > 10 * 1024 * 1024) return { error: "Dosya çok büyük! Maksimum 10MB PDF yükleyebilirsiniz." };
  if (file.type !== 'application/pdf') return { error: "Sadece PDF dosyaları kabul edilmektedir." };

  try {
    const { user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `scripts/${uniquePrefix}-${safeName}`;
    
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = adminStorage.bucket(bucketName);
    const fileRef = bucket.file(filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fileRef.save(buffer, {
      metadata: { 
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=31536000'
      }
    });

    try { await fileRef.makePublic(); } catch (e) {}

    const fileUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

    await adminDb.collection('scripts').add({
      title,
      playId: playId || 'GENEL',
      fileUrl,
      author: user.name,
      authorEmail: user.email,
      createdAt: new Date().toISOString()
    });

    revalidatePath('/members');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteScript(formData: FormData) {
  const scriptId = formData.get('scriptId') as string;
  if (!scriptId) return;

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);
    
    const scriptRef = adminDb.collection('scripts').doc(scriptId);
    const scriptDoc = await scriptRef.get();
    
    if (scriptDoc.exists) {
      const data = scriptDoc.data();
      if (data?.fileUrl) {
        await deleteStorageFile(data.fileUrl);
      }
      await scriptRef.delete();
    }

    revalidatePath('/members');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function toggleLike(postId: string) {
  try {
    const { user } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    const email = user.email.toLowerCase();
    
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) return { error: "Yazı bulunamadı." };
    
    const likes = postDoc.data()?.likes || [];
    const isLiked = likes.includes(email);
    
    if (isLiked) {
      await postRef.update({
        likes: likes.filter((e: string) => e !== email)
      });
    } else {
      await postRef.update({
        likes: [...likes, email]
      });
    }
    
    revalidatePath(`/blog/${postId}`);
    revalidatePath('/blog');
    return { success: true, isLiked: !isLiked };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function addComment(formData: FormData) {
  const postId = formData.get('postId') as string;
  const content = formData.get('content') as string;

  if (!postId || !content) return { error: "Mesaj boş olamaz." };

  try {
    const { user } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    
    await adminDb.collection('posts').doc(postId).collection('comments').add({
      content,
      author: user.name,
      authorEmail: user.email,
      photoUrl: user.photoUrl || '',
      createdAt: new Date().toISOString()
    });

    revalidatePath(`/blog/${postId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function markAttendance(rehearsalId: string, userIds: string[]) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    
    await adminDb.collection('rehearsals').doc(rehearsalId).update({
      attendance: userIds,
      attendanceUpdatedAt: new Date().toISOString()
    });

    revalidatePath('/members/rehearsals');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Şifre sıfırlama talebi oluşturur.
 */
export async function requestPasswordReset(formData: FormData) {
  try {
    const email = (formData.get('email') as string)?.toLowerCase();
    if (!email) return { error: "E-posta adresi gereklidir." };

    // Kullanıcı kontrolü
    const userSnapshot = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (userSnapshot.empty) {
      return { error: "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı." };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600000); // 1 saat sonra

    await adminDb.collection('passwordResets').add({
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    });

    const headerList = await headers();
    const host = headerList.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;

    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${email}`;
    await sendPasswordResetEmail(email, resetLink);

    return { success: true, message: "Şifre sıfırlama linki e-postanıza gönderildi." };
  } catch (error: any) {
    console.error("[PWD_RESET_REQ] Detaylı Hata:", error);
    // Hatanın sebebini kullanıcıya (ve bize) daha açık göstermek için:
    const errorMessage = error.message?.includes("Resend") 
      ? "E-posta servisi (Resend) bağlantı hatası verdi. Lütfen API anahtarını kontrol edin."
      : error.message || "Bilinmeyen bir hata oluştu.";
    
    return { error: `İşlem başarısız: ${errorMessage}` };
  }
}

/**
 * Şifreyi yeni şifreyle günceller.
 */
export async function completePasswordReset(formData: FormData) {
  try {
    const token = formData.get('token') as string;
    const email = (formData.get('email') as string)?.toLowerCase();
    const newPassword = formData.get('newPassword') as string;

    if (!token || !email || !newPassword) return { error: "Geçersiz istek." };

    const resetSnap = await adminDb.collection('passwordResets')
      .where('token', '==', token)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (resetSnap.empty) return { error: "Geçersiz veya süresi dolmuş anahtar." };

    const resetDoc = resetSnap.docs[0];
    const resetData = resetDoc.data();
    
    if (new Date(resetData.expiresAt) < new Date()) {
      await resetDoc.ref.delete();
      return { error: "Link süresi dolmuş." };
    }

    const userSnap = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (userSnap.empty) return { error: "Kullanıcı bulunamadı." };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userSnap.docs[0].ref.update({ password: hashedPassword });
    await resetDoc.ref.delete();

    return { success: true, message: "Şifreniz güncellendi." };
  } catch (error: any) {
    console.error("[PWD_RESET_COMPLETE] Hata:", error);
    return { error: "Hata oluştu." };
  }
}

