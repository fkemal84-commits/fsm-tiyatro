'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, uploadToStorage } from './common';

export async function addTeamNeed(formData: FormData) {
  const roleName = formData.get('roleName') as string;
  const description = formData.get('description') as string;

  if (!roleName || !description) return;

  await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);

  await adminDb.collection('teamNeeds').add({
    roleName: roleName.trim(),
    description: description.trim(),
    isActive: true,
    createdAt: new Date().toISOString()
  });

  revalidatePath('/members');
  revalidatePath('/tanerabi/dashboard');
}

export async function deleteTeamNeed(formData: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);
    const needId = formData.get('needId') as string;
    if (!needId) return { error: "İlan ID gereklidir." };

    await adminDb.collection('teamNeeds').doc(needId).delete();

    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_TEAM_NEED] Hata:", error);
    return { error: error.message };
  }
}

export async function applyForTeamNeed(formData: FormData) {
  try {
    const { user, uid } = await requireAuth([
      'MEMBER', 'AKTOR', 'PLAYER', 'EDITOR', 'SALES', 
      'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN'
    ]);

    const needId = formData.get('needId') as string;
    const roleName = (formData.get('roleName') as string) || 'Ekip Görevi';
    const note = (formData.get('note') as string) || '';

    if (!needId) return { error: "İlan bilgisi bulunamadı." };

    // Daha önce başvurmuş mu kontrol et
    const existing = await adminDb.collection('teamApplications')
      .where('needId', '==', needId)
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      return { error: "Bu ilana daha önce zaten başvurdunuz." };
    }

    const fullName = [user.name, user.surname].filter(Boolean).join(' ') || user.email;

    await adminDb.collection('teamApplications').add({
      needId,
      roleName,
      userId: uid,
      userName: fullName,
      userEmail: user.email,
      userPhone: user.formattedPhone || user.phone || '',
      userDepartment: user.department || '',
      note: note.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[APPLY_TEAM_NEED] Hata:", error);
    return { error: error.message || "Başvuru gönderilirken hata oluştu." };
  }
}

export async function deleteTeamApplication(formData: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);
    const appId = formData.get('appId') as string;
    if (!appId) return { error: "Başvuru ID gereklidir." };

    await adminDb.collection('teamApplications').doc(appId).delete();

    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_TEAM_APP] Hata:", error);
    return { error: error.message };
  }
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
        contactEmail: 'info@fsmtiyatro.com',
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
    await requireAuth(['SUPERADMIN', 'ADMIN', 'EDITOR']);

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    // 1. Gişe durumu
    const ticketQueryVal = formData.get('isTicketQueryActive');
    if (ticketQueryVal !== null && ticketQueryVal !== undefined) {
      updatePayload.isTicketQueryActive = ticketQueryVal === 'true' || ticketQueryVal === 'on';
    }

    // 2. Hero Görseli / Arka Plan Dosyası Yükleme (PNG, JPG, WEBP, PDF vb.)
    const heroImageFile = formData.get('heroImage') as File | null;
    const heroImageUrlInput = formData.get('heroImageUrl') as string | null;

    if (heroImageFile && heroImageFile.size > 0) {
      console.log(`[SITE_CONFIG] Hero görseli yükleniyor: ${heroImageFile.name}, ${heroImageFile.size} byte`);
      const uploadedUrl = await uploadToStorage(heroImageFile, 'hero');
      console.log(`[SITE_CONFIG] Hero görseli yüklendi: ${uploadedUrl}`);
      updatePayload.heroImageUrl = uploadedUrl;
    } else if (heroImageUrlInput !== null && heroImageUrlInput !== undefined && heroImageUrlInput.trim() !== '') {
      updatePayload.heroImageUrl = heroImageUrlInput.trim();
    }

    // 3. Başlık ve Alt Başlık (İsteğe bağlı)
    const heroTitle = formData.get('heroTitle') as string | null;
    if (heroTitle !== null && heroTitle !== undefined && heroTitle.trim() !== '') {
      updatePayload.heroTitle = heroTitle.trim();
    }

    const heroSubtitle = formData.get('heroSubtitle') as string | null;
    if (heroSubtitle !== null && heroSubtitle !== undefined && heroSubtitle.trim() !== '') {
      updatePayload.heroSubtitle = heroSubtitle.trim();
    }

    // 4. İletişim E-Postası
    const contactEmail = formData.get('contactEmail') as string | null;
    if (contactEmail !== null && contactEmail !== undefined) {
      updatePayload.contactEmail = contactEmail.trim();
    }

    // 5. Pinli slaytlar
    const pinnedSlidesRaw = formData.get('pinnedSlides');
    if (pinnedSlidesRaw !== null && pinnedSlidesRaw !== undefined) {
      try {
        updatePayload.pinnedSlides = JSON.parse(pinnedSlidesRaw as string);
      } catch {
        updatePayload.pinnedSlides = formData.getAll('pinnedSlides') as string[];
      }
    }

    await adminDb.collection('settings').doc('site_config').set(updatePayload, { merge: true });
    console.log(`[SITE_CONFIG] Firestore settings/site_config güncellendi:`, updatePayload);

    revalidatePath('/');
    revalidatePath('/biletimi-bul');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_SITE_CONFIG] Hata:", error);
    return { error: error.message || "Ayarlar kaydedilirken hata oluştu." };
  }
}

export async function updateUserTitles(userId: string, titles: string[]) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);
    if (!userId) return { error: "Kullanıcı ID gereklidir." };

    const cleanTitles = Array.isArray(titles) 
      ? titles.map(t => typeof t === 'string' ? t.trim() : '').filter(Boolean)
      : [];

    await adminDb.collection('users').doc(userId).update({
      titles: cleanTitles,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/tanerabi/dashboard');
    revalidatePath('/kulup');
    revalidatePath(`/tanerabi/users/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_USER_TITLES] Hata:", error);
    return { error: error.message || "Unvanlar güncellenemedi." };
  }
}

export async function addAvailableTitle(formData: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);
    const title = (formData.get('title') as string)?.trim();
    if (!title) return { error: "Unvan adı boş olamaz." };

    const docRef = adminDb.collection('settings').doc('titles');
    const docSnap = await docRef.get();

    const existingList: string[] = docSnap.exists ? (docSnap.data()?.list || []) : [
      'Kulüp Başkanı', 'Başkan Yardımcısı', 'Sayman', 'Genel Sekreter', 
      'Yönetim Kurulu Üyesi', 'Denetim Kurulu Üyesi', 'Dekor & Sahne Amiri',
      'Kostüm & Aksesuar', 'Işık & Ses', 'Sosyal Medya & Tasarım', 'Dramaturg'
    ];

    if (!existingList.includes(title)) {
      existingList.push(title);
      await docRef.set({ list: existingList, updatedAt: new Date().toISOString() }, { merge: true });
    }

    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[ADD_AVAILABLE_TITLE] Hata:", error);
    return { error: error.message || "Unvan eklenemedi." };
  }
}

export async function removeAvailableTitle(title: string) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);
    if (!title) return { error: "Unvan seçilmedi." };

    const docRef = adminDb.collection('settings').doc('titles');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const currentList: string[] = docSnap.data()?.list || [];
      const updatedList = currentList.filter(t => t !== title);
      await docRef.set({ list: updatedList, updatedAt: new Date().toISOString() }, { merge: true });
    }

    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("[REMOVE_AVAILABLE_TITLE] Hata:", error);
    return { error: error.message || "Unvan silinemedi." };
  }
}

export async function getAvailableTitles(): Promise<string[]> {
  try {
    const docRef = adminDb.collection('settings').doc('titles');
    const docSnap = await docRef.get();
    if (docSnap.exists && Array.isArray(docSnap.data()?.list)) {
      return docSnap.data()!.list;
    }
    return [
      'Kulüp Başkanı', 'Başkan Yardımcısı', 'Sayman', 'Genel Sekreter', 
      'Yönetim Kurulu Üyesi', 'Denetim Kurulu Üyesi', 'Dekor & Sahne Amiri',
      'Kostüm & Aksesuar', 'Işık & Ses', 'Sosyal Medya & Tasarım', 'Dramaturg'
    ];
  } catch (e) {
    console.error("[GET_AVAILABLE_TITLES] Hata:", e);
    return [
      'Kulüp Başkanı', 'Başkan Yardımcısı', 'Sayman', 'Genel Sekreter', 
      'Yönetim Kurulu Üyesi', 'Denetim Kurulu Üyesi', 'Dekor & Sahne Amiri',
      'Kostüm & Aksesuar', 'Işık & Ses', 'Sosyal Medya & Tasarım', 'Dramaturg'
    ];
  }
}

