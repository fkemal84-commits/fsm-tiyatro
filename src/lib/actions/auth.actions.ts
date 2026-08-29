'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from 'crypto';
import { headers } from 'next/headers';
import { requireAuth, deleteStorageFile, uploadToStorage, handleServerError } from './common';

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const email = formData.get('email') as string;
    const rawInputPhone = (formData.get('phone') as string || '').trim();
    const department = (formData.get('department') as string || '').trim();
    const password = formData.get('password') as string;
    const consent = formData.get('consent') ? true : false;

    if (!email || !password || !rawInputPhone || !name || !surname) {
      return { error: "Tüm alanlar zorunludur." };
    }

    if (name.length > 50 || surname.length > 50) return { error: "İsim veya soyisim çok uzun." };
    if (email.length > 100) return { error: "E-posta adresi çok uzun." };
    if (password.length > 512) return { error: "Geçersiz şifre formatı." };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { error: "Geçersiz e-posta formatı." };

    // Akıllı Telefon Temizleme: +90, 90, 0 veya boşlukları temizleyip 10 haneli (5xxxxxxxxx) elde et
    let cleanDigits = rawInputPhone.replace(/\D/g, '');
    if (cleanDigits.startsWith('90') && cleanDigits.length === 12) {
      cleanDigits = cleanDigits.slice(2);
    } else if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
      cleanDigits = cleanDigits.slice(1);
    }

    if (cleanDigits.length !== 10 || !cleanDigits.startsWith('5')) {
      return { error: "Lütfen geçerli bir cep telefonu numarası giriniz (Örn: 5xx xxx xx xx)." };
    }

    const phone = `+90${cleanDigits}`;
    const formattedPhone = `0${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3, 6)} ${cleanDigits.slice(6, 8)} ${cleanDigits.slice(8, 10)}`;

    const existingUsers = await adminDb.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    if (!existingUsers.empty) return { error: "Bu e-posta adresiyle zaten kayıt olunmuş." };

    const hashedPassword = await bcrypt.hash(password, 10);

    const isSchoolEmail = email.toLowerCase().endsWith('@stu.fsm.edu.tr');
    const role = isSchoolEmail ? 'MEMBER' : 'PENDING';

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // Tiyatro & Üniversite Sezon Takvimi:
    // Temmuz ve sonrasındaki (Ağustos, Eylül, Ekim...) kayıtlar başlayan yeni sezonun (örn. 2026-2027 / 2027) kaydıdır.
    const startYear = currentMonth >= 7 ? currentYear : currentYear - 1;
    const targetSeasonYear = (startYear + 1).toString(); // örn: "2027"
    const academicYear = `${startYear}-${startYear + 1}`;
    const season = `${startYear}-${startYear + 1} Sezonu`;

    // Eğer site ayarlarında özel bir aktif sezon belirlenmişse onu da kontrol et
    let activeSeason = season;
    let activeSeasonYear = targetSeasonYear;
    try {
      const configSnap = await adminDb.collection('settings').doc('site_config').get();
      if (configSnap.exists && configSnap.data()?.activeSeason) {
        activeSeason = configSnap.data()!.activeSeason;
        // Eğer format 2026-2027 ise 2027'yi seasonYear yap
        const match = activeSeason.match(/\d{4}$/);
        if (match) activeSeasonYear = match[0];
      }
    } catch {
      // Varsayılan hesaplama geçerli
    }

    await adminDb.collection('users').add({
      name: name.trim(),
      surname: surname.trim(),
      email: email.toLowerCase().trim(),
      phone,
      formattedPhone,
      rawPhone: cleanDigits,
      department,
      password: hashedPassword,
      consent,
      role,
      registrationYear: activeSeasonYear, // 2027
      season: activeSeason,               // "2026-2027 Sezonu"
      academicYear,                       // "2026-2027"
      createdAt: now.toISOString()
    });

    return { success: true, pending: !isSchoolEmail };
  } catch (error) {
    return handleServerError(error, "REGISTER");
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
  } catch (error) {
    return handleServerError(error, "APPROVE_USER");
  }
}

export async function rejectUser(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    if (!userId) return { error: "Kullanıcı ID gereklidir." };

    await requireAuth(['SUPERADMIN', 'ADMIN']);

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return { error: "Kullanıcı bulunamadı." };

    const userData = userDoc.data();
    if (userData?.role !== 'PENDING') {
      return { error: "Sadece onay bekleyen kullanıcılar reddedilebilir." };
    }

    await adminDb.collection('users').doc(userId).delete();

    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "REJECT_USER");
  }
}

export async function changePassword(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const newPasswordConfirm = formData.get('newPasswordConfirm') as string;

  if (newPassword !== newPasswordConfirm) return { error: "Yazdığınız yeni şifreler eşleşmiyor." };
  if (newPassword.length < 6) return { error: "Girdiğiniz yeni şifre en az 6 karakter olmalıdır." };
  if (newPassword.length > 512) return { error: "Şifre verisi çok büyük." };

  try {
    const { user, uid } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) return { error: "Girdiğiniz mevcut şifreniz yanlış." };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await adminDb.collection('users').doc(uid).update({ password: hashedPassword });

    return { success: true };
  } catch (error) {
    return handleServerError(error, "CHANGE_PASSWORD");
  }
}

export async function updateProfile(formData: FormData) {
  const photoUrl = formData.get('photoUrl') as string;
  const department = formData.get('department') as string;
  const hobbies = formData.get('hobbies') as string;
  const pastPlays = formData.get('pastPlays') as string;
  const skills = formData.get('skills') as string;
  const bio = formData.get('bio') as string;
  const displayTitle = (formData.get('displayTitle') as string)?.trim();

  try {
    const { uid } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);

    await adminDb.collection('users').doc(uid).update({
      ...(photoUrl ? { photoUrl } : {}),
      ...(displayTitle !== undefined ? { displayTitle } : {}),
      department: department || '',
      hobbies: hobbies || '',
      pastPlays: pastPlays || '',
      skills: skills || '',
      bio: bio || '',
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/profile');
    revalidatePath('/kulup/ekip');
    revalidatePath('/kulis');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPDATE_PROFILE");
  }
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

  if (currentUserRole === 'ADMIN') {
    if (targetRole === 'SUPERADMIN' || targetRole === 'ADMIN') return;
    if (newRole === 'SUPERADMIN' || newRole === 'ADMIN') return;
  }

  if (targetRole === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') return;

  await targetDoc.ref.update({ role: newRole });
  revalidatePath('/tanerabi/dashboard');
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get('file') || formData.get('photo');
  if (!file || !(file instanceof File)) return { error: "Yüklenecek dosya seçilmedi." };

  try {
    const { user, uid } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);

    const email = user.email.toLowerCase();
    const folder = `avatars/${email.replace(/[@.]/g, '_')}`;

    // Eski profil fotoğrafı varsa kotayı korumak için Firebase Storage'dan sil
    if (user.photoUrl) {
      await deleteStorageFile(user.photoUrl);
    }

    const publicUrl = await uploadToStorage(file, folder);

    await adminDb.collection('users').doc(uid).update({ photoUrl: publicUrl });

    revalidatePath('/profile');
    revalidatePath('/tanerabi/dashboard');
    return { success: true, photoUrl: publicUrl };
  } catch (error) {
    return handleServerError(error, "UPLOAD_AVATAR");
  }
}

export async function deleteUserRecord(formData: FormData) {
  const targetUserId = formData.get('userId') as string;
  if (!targetUserId) return;

  const session = await requireAuth(['SUPERADMIN', 'ADMIN']);
  const currentUserRole = (session.user as any).role;

  const targetDoc = await adminDb.collection('users').doc(targetUserId).get();
  if (!targetDoc.exists) return;

  const targetData = targetDoc.data()!;
  const targetRole = targetData.role;

  // SUPERADMIN silinemez
  if (targetRole === 'SUPERADMIN') return;
  // ADMIN sadece SUPERADMIN tarafından silinebilir
  if (targetRole === 'ADMIN' && currentUserRole !== 'SUPERADMIN') return;

  // Kullanıcının profil fotoğrafı varsa Storage'dan temizle
  if (targetData.photoUrl) {
    await deleteStorageFile(targetData.photoUrl);
  }

  await targetDoc.ref.delete();
  revalidatePath('/tanerabi/dashboard');
}

export async function requestPasswordReset(formData: FormData) {
  try {
    const email = (formData.get('email') as string)?.toLowerCase();
    if (!email) return { error: "E-posta adresi gereklidir." };

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
  } catch (error) {
    return handleServerError(error, "PWD_RESET_REQ");
  }
}

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
  } catch (error) {
    return handleServerError(error, "PWD_RESET_COMPLETE");
  }
}
