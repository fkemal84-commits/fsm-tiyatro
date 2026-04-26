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

    // --- INPUT VALIDATION & SANITIZATION ---
    if (!email || !password || !rawPhone || !name || !surname) {
      return { error: "Tüm alanlar zorunludur." };
    }

    // Uzunluk Kontrolleri (Injection ve DoS önlemi)
    if (name.length > 50 || surname.length > 50) return { error: "İsim veya soyisim çok uzun." };
    if (email.length > 100) return { error: "E-posta adresi çok uzun." };
    if (password.length > 512) return { error: "Geçersiz şifre formatı." }; // Hash bekliyoruz
    if (rawPhone.length > 15) return { error: "Telefon numarası çok uzun." };

    // Tip ve Format Kontrolleri
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { error: "Geçersiz e-posta formatı." };

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
  
  // Şifre hash uzunluğu kontrolü (Client-side'dan hash gelmeli)
  if (newPassword.length < 6) return { error: "Girdiğiniz yeni şifre geçersiz." };
  if (newPassword.length > 512) return { error: "Şifre verisi çok büyük." };

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

export async function addRehearsal(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const rehearsalDate = formData.get('rehearsalDate') as string;
    const rehearsalTime = formData.get('rehearsalTime') as string;
    const location = formData.get('location') as string;
    const notes = formData.get('notes') as string;
    const saveAsPreset = formData.get('saveAsPreset') === 'on';

    if (!title || !rehearsalDate || !rehearsalTime || !location) return { error: "Gerekli alanlar eksik." };

    // Eğer şablon olarak kaydet seçildiyse presetlere ekle
    if (saveAsPreset) {
      await adminDb.collection('presets').add({
        type: 'rehearsal',
        title,
        location,
        time: rehearsalTime,
        createdAt: new Date().toISOString()
      });
    }

    const dateObj = new Date(rehearsalDate);
    const formattedDate = dateObj.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });

    const isoDate = dateObj.toISOString().split('T')[0];

    const date = `${formattedDate} - Saat: ${rehearsalTime}`;

    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR', 'AKTOR']);

    await adminDb.collection('rehearsals').add({
      title,
      date,
      isoDate,
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
    revalidatePath('/members/rehearsals');
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
export async function nudgePlayers(targetUserIds?: string[]) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const messages = [
      "🎭 Ezberler su gibi olsun arkadaşlar. Sahne sizi bekler! 🎬",
      "📢 Sahne tozu yutmaya az kaldı, mazeret istemiyorum! 🎭",
      "🎬 Rolünü yaşamayan, kuliste çay dağıtır! 😂",
      "🎭 Tiradın ortasında unutulan replik, yönetmenin kalbine inen oktur! 🏹",
      "📢 Provaya geç kalan dekora yardım eder, ona göre! 🎨",
      "🎭 'Olmak ya da olmamak' değil mesele, 'Gelmek ya da gelmemek'! 🚶‍♂️",
      "🎬 Reji masasında sinirden kalem kırdırtmayın bana! ✏️💥",
      "🎭 Işıklar yandığında orada mısın yoksa evde Netflix mi? 📺",
      "📢 Bugün ezbersiz geleni suyla ıslatırım, şaka değil! 💧😂",
      "🎭 Sahne disiplini olmayan, pandomim yapsın! 🤫🎭",
      "🎬 Sesin salona ulaşmıyorsa, fısıldaşmaya devam etme! 📣",
      "🎭 'Godot'yu Beklerken' değil burası, seni bekliyoruz! ⏳🎞️",
      "📢 Textini yastığının altına koyup uyuma, oku! 📖😴",
      "🎭 Kuliste gıybet bittiyse sahneye buyurun beyler/bayanlar! ☕",
      "🎬 Bu oyunun yıldızı sensin ama sadece ezerbini tamamlarsan! ⭐",
      "🎭 Kostümün sığmıyorsa bu senin değil, diyetsizliğin suçudur! 🍎😂",
      "📢 Repliklerin havada uçuştuğu saatlerdeyiz, yakala! 💨",
      "🎭 Karakterine gir dedik, kapıda kal demedik! 🚪🚶‍♀️",
      "🎬 Reji sinirli, reji gergin, reji acıktı! Gel de yemek söyleyelim! 🍕",
      "🎭 Sahnedeki gölgen bile senden daha iyi oynuyor şu an! 👤😂",
      "📢 Dekoru taşıyacak kollara, repliği taşıyacak beyne ihtiyaç var! 💪🧠",
      "🎭 Hayalindeki alkışlar için bugün terlemek zorundasın! 🔥👏",
      "🎬 Perde arkasında saklanma, sahnenin tozuna bulan! 🕸️",
      "🎭 Bu oyun bitmez, sen gelirsen ama belki biter! 😂",
      "📢 Mazeretin 'otobüs kaçtı' ise, koşarak gelmeye başla! 🏃‍♂️",
      "🎭 Tiyatro bir ekip işidir, ekibin en zayıf halkası olma! ⛓️",
      "🎬 Ezberin sıfırsa makyajın seni kurtarmaz! 💄🤡",
      "🎭 Replikleri kendi dilinde değil, yazarın dilinde söyle! 👅",
      "📢 Sahne üzerinde uyuyan güzel istemiyoruz, canlanın! 🤴✨",
      "🎭 Duygu ver dedik, borç ver demedik! Oynayın! 😂💸",
      "🎬 Perde açıldığında 'öksürük' krizine girmek istemiyorsan çalış! 😷",
      "🎭 Sanat sanat içindir; prova senin için! 🎨",
      "📢 Reji masasında ejderha besliyorum, geç kalanı yiyor! 🐉😂",
      "🎭 Replik geçişlerin I-KAR-US gibi yere çakılmasın! ☀️🪽",
      "🎬 Teksti unutup doğaçlama yapma, Oscar vermiyoruz! 🏆",
      "🎭 Alkışlar kulağında çınlasın, tekstin elinde paralansın! 👏📖",
      "📢 Bugün provada olmayan, gala yemeğinde de olmaz! 🥙😂",
      "🎭 Dram dedik ama senin gelmemen kadar dramatik değil! 🎭😢",
      "🎬 Kuliste fısıldaşma, sahnede haykır! 🗣️",
      "🎭 En kötü prova bile, yapılmayan provadan iyidir! 🎭",
      "📢 'To be or not to be', provaya gel gerisini sorma! 🎞️"
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    let res;
    if (targetUserIds && targetUserIds.length > 0) {
      // Sadece seçilenlere gönder
      const tokensSnap = await adminDb.collection('fcmTokens').where('userId', 'in', targetUserIds).get();
      const tokens = tokensSnap.docs.map(doc => doc.id);

      if (tokens.length === 0) return { success: false, error: "Seçilen oyuncuların kayıtlı cihazı bulunamadı." };

      const message = {
        notification: { title: "🎭 Yönetmen Dürtmesi!", body: randomMsg },
        data: { url: '/members/rehearsals' },
        tokens: tokens
      };
      const response = await adminMessaging.sendEachForMulticast(message);
      res = { success: true, count: response.successCount, failure: response.failureCount };
    } else {
      // Herkese gönder
      res = await sendPushToAll("🎭 Yönetmen Dürtmesi!", randomMsg, '/members/rehearsals');
    }

    return { success: true, ...res };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Anlık Yoklama Başlat (Hızlı Kayıt)
// Mükerrer startInstantAttendance kaldırıldı (Aşağıda güncel hali var)

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

  revalidatePath('/members');
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

    try { await fileRef.makePublic(); } catch (e) { }

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

// --- YOKLAMA & NABIZ SİSTEMİ ---

export async function startPulseCheck(rehearsalId: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const expiresAt = Date.now() + 60000;

    await adminDb.collection('rehearsals').doc(rehearsalId).update({
      pulseActive: true,
      pulseExpiresAt: expiresAt,
      pulseResponses: [],
      pulseStartedBy: userId // Başlatanı kaydet
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function respondToPulse(rehearsalId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Oturum yok.");
    const userId = (session.user as any).id;

    const doc = await adminDb.collection('rehearsals').doc(rehearsalId).get();
    const data = doc.data();

    if (!data?.pulseActive || Date.now() > data.pulseExpiresAt) {
      throw new Error("Yoklama süresi dolmuş veya hiç başlatılmamış.");
    }

    // Kullanıcıyı yanıtlara ekle (Object Structure: { userId, joinedAt })
    const currentResponses = data.pulseResponses || [];

    // Daha önce yanıt vermiş mi kontrol et (Object array içinde)
    const hasResponded = currentResponses.some((r: any) => (typeof r === 'string' ? r === userId : r.userId === userId));

    if (!hasResponded) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newResponse = {
        userId,
        joinedAt: Date.now(),
        timeString
      };

      await adminDb.collection('rehearsals').doc(rehearsalId).update({
        pulseResponses: [...currentResponses, newResponse]
      });
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Manuel Yoklama/Mazeret Ekleme
export async function addManualAttendance(rehearsalId: string, userId: string, status: string, note: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    const docRef = adminDb.collection('rehearsals').doc(rehearsalId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error("Prova bulunamadı.");

    const data = doc.data() || {};
    const currentAttendance = data.attendance || {};
    const currentNotes = data.attendanceNotes || "";

    // Mazereti işle
    await docRef.update({
      attendance: {
        ...currentAttendance,
        [userId]: status
      },
      attendanceNotes: currentNotes + (currentNotes ? "\n" : "") + `[MAZERET] ${note}`
    });

    revalidatePath('/members/rehearsals');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function finalizeAttendance(rehearsalId: string, attendanceData: any, attendanceNotes: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    await adminDb.collection('rehearsals').doc(rehearsalId).update({
      attendance: attendanceData,
      attendanceNotes,
      attendanceUpdatedAt: new Date().toISOString(),
      pulseActive: false // Seansı kapat
    });

    revalidatePath('/members/rehearsals');
    return { success: true };
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

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const expiresAt = Date.now() + 60000;
    const docRef = await adminDb.collection('rehearsals').add({
      title,
      date: `${dateStr} - Saat: ${timeStr} (Anlık)`,
      location: 'Sahne / Salon',
      notes: 'Bu kayıt yönetim panelinden anlık olarak başlatılmıştır.',
      attendance: {},
      pulseActive: true,
      pulseExpiresAt: expiresAt,
      pulseResponses: [],
      pulseStartedBy: userId,
      createdAt: now.toISOString()
    });

    revalidatePath('/members/rehearsals');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("[INSTANT_ATTENDANCE] Hata:", error);
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

/**
 * Kullanıcıya oyun/kadro ataması yapar.
 */
export async function updateUserPlays(userId: string, playIds: string[]) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);

    await adminDb.collection('users').doc(userId).update({
      assignedPlays: playIds,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/members/team');
    revalidatePath(`/tanerabi/users/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_USER_PLAYS] Hata:", error);
    return { error: error.message };
  }
}

/**
 * Mevcut bir prova kaydı için yoklamayı (pulse) aktif hale getirir.
 */
export async function activateRehearsalPulse(rehearsalId: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    
    await adminDb.collection('rehearsals').doc(rehearsalId).update({
      pulseActive: true,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/members/rehearsals');
    revalidatePath('/members/attendance');
    return { success: true };
  } catch (error: any) {
    console.error("[ACTIVATE_REHEARSAL_PULSE] Hata:", error);
    return { error: error.message };
  }
}

// --- BİLET SİSTEMİ EYLEMLERİ ---

export async function addTicket(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const identifier = formData.get('identifier') as string; // Telefon veya No

    if (!name || !surname || !identifier) return { error: "Lütfen tüm alanları doldurun." };

    await requireAuth(['SUPERADMIN', 'ADMIN']);

    const newTicket = await adminDb.collection('tickets').add({
      name: name.trim().toLowerCase(),
      surname: surname.trim().toLowerCase(),
      identifier: identifier.trim(),
      status: 'VALID',
      createdAt: new Date().toISOString()
    });

    revalidatePath('/tanerabi/tickets');
    return { success: true, ticketId: newTicket.id };
  } catch (error: any) {
    console.error("[ADD_TICKET] Hata:", error);
    return { error: error.message };
  }
}

export async function findTicket(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    
    if (!name || !surname) return { error: "İsim ve soyisim gereklidir." };

    const snapshot = await adminDb.collection('tickets')
      .where('name', '==', name.trim().toLowerCase())
      .where('surname', '==', surname.trim().toLowerCase())
      .get();
      
    if (snapshot.empty) return { error: "Bu bilgilere ait bir bilet bulunamadı." };

    // Sadece ilk bileti getir (Geliştirilebilir)
    const doc = snapshot.docs[0];
    const data = doc.data();

    return { 
      success: true, 
      ticket: {
        id: doc.id,
        name: data.name,
        surname: data.surname,
        status: data.status
      }
    };
  } catch (error: any) {
    console.error("[FIND_TICKET] Hata:", error);
    return { error: "Sorgulama sırasında bir hata oluştu." };
  }
}

export async function verifyTicket(ticketId: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);
    
    const ticketRef = adminDb.collection('tickets').doc(ticketId);
    const doc = await ticketRef.get();
    
    if (!doc.exists) return { error: "Böyle bir bilet sistemde kayıtlı değil!" };
    
    const data = doc.data();
    if (data?.status === 'USED') {
      return { error: `Bu bilet daha önce kullanılmış!` };
    }

    await ticketRef.update({ 
      status: 'USED', 
      usedAt: new Date().toISOString() 
    });

    return { success: true, message: `${data?.name.toUpperCase()} ${data?.surname.toUpperCase()} - GİRİŞ ONAYLANDI` };
  } catch (error: any) {
    console.error("[VERIFY_TICKET] Hata:", error);
    return { error: error.message || "Bilet doğrulanırken bir hata oluştu." };
  }
}
