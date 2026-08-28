'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from 'crypto';
import { headers } from 'next/headers';
import { requireAuth, deleteStorageFile, uploadToStorage } from './common';

export async function registerUser(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const email = formData.get('email') as string;
    const countryCode = formData.get('countryCode') as string;
    const rawPhoneWithSpaces = formData.get('phone') as string;
    const rawPhone = rawPhoneWithSpaces ? rawPhoneWithSpaces.replace(/\s/g, '') : '';
    const password = formData.get('password') as string;
    const consent = formData.get('consent') ? true : false;

    if (!email || !password || !rawPhone || !name || !surname) {
      return { error: "Tüm alanlar zorunludur." };
    }

    if (name.length > 50 || surname.length > 50) return { error: "İsim veya soyisim çok uzun." };
    if (email.length > 100) return { error: "E-posta adresi çok uzun." };
    if (password.length > 512) return { error: "Geçersiz şifre formatı." };
    if (rawPhone.length > 15) return { error: "Telefon numarası çok uzun." };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { error: "Geçersiz e-posta formatı." };

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(rawPhone)) {
      return { error: "Lütfen geçerli bir telefon numarası giriniz (10 hane, başında 0 olmadan)." };
    }

    const phone = `${countryCode || '+90'}${rawPhone}`;

    const existingUsers = await adminDb.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    if (!existingUsers.empty) return { error: "Bu e-posta adresiyle zaten kayıt olunmuş." };

    const hashedPassword = await bcrypt.hash(password, 10);

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
  } catch (error: any) {
    console.error("[REJECT_USER] Hata:", error);
    return { error: error.message };
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

    const publicUrl = await uploadToStorage(file, folder);

    await adminDb.collection('users').doc(uid).update({ photoUrl: publicUrl });

    revalidatePath('/profile');
    revalidatePath('/tanerabi/dashboard');
    return { success: true, photoUrl: publicUrl };
  } catch (error: any) {
    console.error("[AVATAR] Hata:", error);
    return { error: error.message || "Fotoğraf yüklenemedi." };
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

  if (currentUserRole === 'ADMIN' && (targetRole === 'SUPERADMIN' || targetRole === 'ADMIN')) return;
  if (targetRole === 'SUPERADMIN' && currentUserRole !== 'SUPERADMIN') return;

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
  } catch (error: any) {
    console.error("[PWD_RESET_REQ] Hata:", error);
    const errorMessage = error.message?.includes("Resend")
      ? "E-posta servisi bağlantı hatası verdi."
      : error.message || "Bilinmeyen bir hata oluştu.";

    return { error: `İşlem başarısız: ${errorMessage}` };
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
  } catch (error: any) {
    console.error("[PWD_RESET_COMPLETE] Hata:", error);
    return { error: "Hata oluştu." };
  }
}
