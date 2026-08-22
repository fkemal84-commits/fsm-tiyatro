'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, uploadToStorage } from './common';

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

export async function getSiteConfig() {
  try {
    const doc = await adminDb.collection('settings').doc('site_config').get();
    if (!doc.exists) {
      return {
        heroImageUrl: '',
        isTicketQueryActive: true,
        contactEmail: 'fsmtiyatro@fsm.edu.tr',
        pinnedSlides: []
      };
    }
    return doc.data();
  } catch (e: any) {
    console.error("Site config fetch error:", e);
    return null;
  }
}

export async function updateSiteConfig(formData: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);

    const isTicketQueryActive = formData.get('isTicketQueryActive') === 'on';
    const heroImageFile = formData.get('heroImage') as File | null;
    const heroImageUrlInput = formData.get('heroImageUrl') as string | null;
    const contactEmail = formData.get('contactEmail') as string | null;
    const pinnedSlides = formData.getAll('pinnedSlides') as string[];

    let finalHeroImageUrl = heroImageUrlInput || '';

    if (heroImageFile && heroImageFile.size > 0) {
      finalHeroImageUrl = await uploadToStorage(heroImageFile, 'hero');
    }

    await adminDb.collection('settings').doc('site_config').set({
      isTicketQueryActive,
      heroImageUrl: finalHeroImageUrl,
      contactEmail: contactEmail || 'fsmtiyatro@fsm.edu.tr',
      pinnedSlides: pinnedSlides || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });

    revalidatePath('/');
    revalidatePath('/biletimi-bul');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_SITE_CONFIG] Hata:", error);
    return { error: error.message || "Ayarlar kaydedilirken hata oluştu." };
  }
}
