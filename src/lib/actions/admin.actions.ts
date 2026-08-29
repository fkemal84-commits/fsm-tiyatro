'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, uploadToStorage, handleServerError } from './common';

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
  } catch (error) {
    return handleServerError(error, "DELETE_TEAM_NEED");
  }
}

export async function updateTeamNeed(formData: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);
    const needId = (formData.get('needId') as string)?.trim();
    const roleName = (formData.get('roleName') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();

    if (!needId || !roleName || !description) {
      return { error: "İlan başlığı ve açıklaması zorunludur." };
    }

    await adminDb.collection('teamNeeds').doc(needId).update({
      roleName,
      description,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/members');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPDATE_TEAM_NEED");
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
  } catch (error) {
    return handleServerError(error, "APPLY_TEAM_NEED");
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
  } catch (error) {
    return handleServerError(error, "DELETE_TEAM_APP");
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
  } catch (error) {
    return handleServerError(error, "UPDATE_USER_PLAYS");
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
  } catch (error) {
    console.error("Site config fetch error:", error);
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
  } catch (error) {
    return handleServerError(error, "UPDATE_SITE_CONFIG");
  }
}

const DEFAULT_TITLE_PERMISSIONS: Record<string, string[]> = {
  'Süper Admin': ['canWritePosts', 'canManagePosts', 'canViewMetrics', 'canManagePlays', 'canManageScripts', 'canViewScripts', 'canManageMembers', 'canAssignTitles', 'canManageEvents', 'canScanTickets', 'canManageSite'],
  'Yönetici (Admin)': ['canWritePosts', 'canManagePosts', 'canViewMetrics', 'canManagePlays', 'canManageScripts', 'canViewScripts', 'canManageMembers', 'canAssignTitles', 'canManageEvents', 'canScanTickets', 'canManageSite'],
  'İçerik Editörü': ['canWritePosts', 'canViewMetrics'],
  'Yönetmen': ['canManagePlays', 'canManageScripts', 'canViewScripts', 'canManageEvents', 'canWritePosts', 'canViewMetrics'],
  'Yrd. Yönetmen': ['canManagePlays', 'canViewScripts', 'canManageEvents', 'canWritePosts'],
  'Oyuncu / Aktör': ['canViewScripts'],
  'Gişe & Satış': ['canScanTickets'],
  'Kulüp Başkanı': ['canManageMembers', 'canAssignTitles', 'canManageEvents', 'canManagePlays', 'canWritePosts', 'canScanTickets', 'canViewMetrics'],
  'Başkan Yardımcısı': ['canManageMembers', 'canAssignTitles', 'canManageEvents', 'canManagePlays', 'canWritePosts'],
  'Sayman': ['canManageMembers', 'canScanTickets', 'canManageEvents'],
  'Genel Sekreter': ['canManageMembers', 'canManageEvents', 'canWritePosts'],
  'Yönetim Kurulu Üyesi': ['canManageMembers', 'canManageEvents'],
  'Denetim Kurulu Üyesi': ['canManageMembers'],
  'Dekor & Sahne Amiri': ['canManagePlays', 'canViewScripts'],
  'Kostüm & Aksesuar': ['canManagePlays', 'canViewScripts'],
  'Işık & Ses': ['canManagePlays', 'canViewScripts'],
  'Sosyal Medya & Tasarım': ['canWritePosts', 'canViewMetrics'],
  'Dramaturg': ['canWritePosts', 'canViewScripts', 'canManageScripts', 'canViewMetrics']
};

export async function updateUserTitles(userId: string, titles: string[]) {
  try {
    const { user: callerUser } = await requireAuth(['SUPERADMIN', 'ADMIN']);
    if (!userId) return { error: "Kullanıcı ID gereklidir." };

    const callerRole = callerUser.role;
    const isSuperAdmin = callerRole === 'SUPERADMIN';

    // Hedef kullanıcı kontrolü
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return { error: "Kullanıcı bulunamadı." };
    const targetUserData = userDoc.data()!;
    const targetCurrentRole = targetUserData.role || 'MEMBER';

    // Süper Admin'i sadece bir başka Süper Admin değiştirebilir
    if (targetCurrentRole === 'SUPERADMIN' && !isSuperAdmin) {
      return { error: "Süper Admin yetkilerini sadece bir Süper Admin düzenleyebilir." };
    }

    const cleanTitles = Array.isArray(titles) 
      ? titles.map(t => typeof t === 'string' ? t.trim() : '').filter(Boolean)
      : [];

    // Yetki Aşımı Koruması (Privilege Escalation Guard)
    if (!isSuperAdmin) {
      // Caller yetkilerini belirle
      const callerTitles: string[] = callerUser.titles || [];
      const callerPermSet = new Set<string>();
      if (callerRole === 'ADMIN') {
        Object.values(DEFAULT_TITLE_PERMISSIONS).forEach(perms => perms.forEach(p => callerPermSet.add(p)));
      } else {
        callerTitles.forEach(t => {
          (DEFAULT_TITLE_PERMISSIONS[t] || []).forEach(p => callerPermSet.add(p));
        });
      }

      // Verilmek istenen her unvanın yetkilerini kontrol et
      for (const title of cleanTitles) {
        const requiredPerms = DEFAULT_TITLE_PERMISSIONS[title] || [];
        const missing = requiredPerms.filter(p => !callerPermSet.has(p));
        if (missing.length > 0) {
          return { error: `"${title}" unvanındaki bazı yetkileri (${missing.join(', ')}) siz taşımadığınız için bu unvanı başkasına veremezsiniz.` };
        }
      }
    }

    // Otomatik Rol / Yetki Senkronizasyonu (Unvan & Perk Birleşimi)
    let newRole = targetCurrentRole;
    if (targetCurrentRole !== 'SUPERADMIN') {
      if (cleanTitles.some(t => t.includes('Admin') || t.includes('Yönetici'))) {
        newRole = 'ADMIN';
      } else if (cleanTitles.some(t => t === 'Yönetmen' || t.includes('Reji'))) {
        newRole = 'DIRECTOR';
      } else if (cleanTitles.some(t => t.includes('Editör') || t.includes('Yazar'))) {
        newRole = 'EDITOR';
      } else if (cleanTitles.some(t => t.includes('Oyuncu') || t.includes('Aktör'))) {
        newRole = 'AKTOR';
      } else if (cleanTitles.some(t => t.includes('Gişe') || t.includes('Satış'))) {
        newRole = 'SALES';
      } else if (cleanTitles.length === 0 && targetCurrentRole !== 'ADMIN') {
        newRole = 'MEMBER';
      }
    }

    await adminDb.collection('users').doc(userId).update({
      titles: cleanTitles,
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/tanerabi/dashboard');
    revalidatePath('/kulup');
    revalidatePath('/members');
    revalidatePath(`/tanerabi/users/${userId}`);
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPDATE_USER_TITLES");
  }
}

export async function addAvailableTitle(formData: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);
    const title = (formData.get('title') as string)?.trim();
    if (!title) return { error: "Unvan adı boş olamaz." };

    const docRef = adminDb.collection('settings').doc('titles');
    const docSnap = await docRef.get();

    const existingList: string[] = docSnap.exists ? (docSnap.data()?.list || []) : Object.keys(DEFAULT_TITLE_PERMISSIONS);

    if (!existingList.includes(title)) {
      existingList.push(title);
      await docRef.set({ list: existingList, updatedAt: new Date().toISOString() }, { merge: true });
    }

    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "ADD_AVAILABLE_TITLE");
  }
}

export async function removeAvailableTitle(titleOrFormData: string | FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN']);
    const title = typeof titleOrFormData === 'string' 
      ? titleOrFormData.trim() 
      : (titleOrFormData.get('title') as string)?.trim();

    if (!title) return { error: "Unvan seçilmedi." };

    const docRef = adminDb.collection('settings').doc('titles');
    const docSnap = await docRef.get();

    const currentList: string[] = docSnap.exists && Array.isArray(docSnap.data()?.list)
      ? docSnap.data()!.list
      : Object.keys(DEFAULT_TITLE_PERMISSIONS);

    const updatedList = currentList.filter(t => t !== title);
    await docRef.set({ list: updatedList, updatedAt: new Date().toISOString() }, { merge: true });

    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "REMOVE_AVAILABLE_TITLE");
  }
}

export async function getAvailableTitles(): Promise<string[]> {
  const defaultList = Object.keys(DEFAULT_TITLE_PERMISSIONS);

  try {
    const docRef = adminDb.collection('settings').doc('titles');
    const docSnap = await docRef.get();
    if (docSnap.exists && Array.isArray(docSnap.data()?.list) && docSnap.data()!.list.length > 0) {
      // Birleşik havuz
      const merged = Array.from(new Set([...defaultList, ...docSnap.data()!.list]));
      return merged;
    }
    return defaultList;
  } catch (e) {
    console.error("[GET_AVAILABLE_TITLES] Hata:", e);
    return defaultList;
  }
}

