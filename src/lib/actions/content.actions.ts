'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth, deleteStorageFile, uploadToStorage, handleServerError } from './common';

export async function addPost(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const excerpt = (formData.get('excerpt') as string) || content.slice(0, 160);
    const category = (formData.get('category') as string) || 'Blog';
    const file = formData.get('image') as File | null;
    const pdfFile = formData.get('pdf') as File | null;
    
    // Sadece 'Makale' kategorisindeki yazılar akademik niteliktedir (Google Scholar & PDF desteği)
    const isAcademic = category === 'Makale' || formData.get('isAcademic') === 'true';
    const abstract = (formData.get('abstract') as string) || excerpt;
    const authorAffiliation = (formData.get('authorAffiliation') as string) || 'Fatih Sultan Mehmet Vakıf Üniversitesi';
    const journalTitle = (formData.get('journalTitle') as string) || 'FSM Tiyatro ve Sahne Sanatları Güncesi';
    const keywordsRaw = (formData.get('keywords') as string) || '';
    const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];

    if (!title || !content) {
      return { error: "Başlık ve içerik alanları zorunludur." };
    }

    const { user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'EDITOR', 'DIRECTOR']);

    let imageUrl = "";
    if (file && file.size > 0) {
      imageUrl = await uploadToStorage(file, 'posts');
    }

    let pdfUrl = "";
    if (pdfFile && pdfFile.size > 0) {
      pdfUrl = await uploadToStorage(pdfFile, 'academic-papers');
    }

    const authorName = [user.name, user.surname].filter(Boolean).join(' ') || user.email.split('@')[0];

    await adminDb.collection('posts').add({
      title,
      content,
      excerpt,
      category,
      imageUrl: imageUrl || null,
      author: authorName,
      authorEmail: user.email,
      academicMeta: isAcademic ? {
        isAcademic: true,
        abstract,
        authorAffiliation,
        journalTitle,
        publisher: 'Fatih Sultan Mehmet Vakıf Üniversitesi',
        keywords,
        pdfUrl: pdfUrl || null,
      } : null,
      createdAt: new Date().toISOString()
    });

    revalidatePath('/');
    revalidatePath('/kulis');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    return handleServerError(error, "ADD_POST");
  }
  redirect('/kulis');
}

export async function deletePost(formData: FormData) {
  const postId = formData.get('postId') as string;
  if (!postId) return;

  try {
    const { session, user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'EDITOR', 'DIRECTOR']);
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    if (!postDoc.exists) return;

    const postData = postDoc.data()!;

    if (user.role === 'EDITOR' && postData.authorEmail !== session.user?.email) {
      throw new Error("Sadece kendi yazılarınızı silebilirsiniz.");
    }

    if (postData.imageUrl) {
      await deleteStorageFile(postData.imageUrl);
    }
    if (postData.academicMeta?.pdfUrl) {
      await deleteStorageFile(postData.academicMeta.pdfUrl);
    }

    await postDoc.ref.delete();
    revalidatePath('/');
    revalidatePath('/kulis');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    handleServerError(error, "DELETE_POST");
  }
}

export async function updatePost(formData: FormData) {
  let targetPostId = "";
  try {
    const postId = formData.get('postId') as string;
    targetPostId = postId;
    if (!postId) {
      return { error: "Yazı ID'si bulunamadı." };
    }

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const excerpt = (formData.get('excerpt') as string) || content.slice(0, 160);
    const category = (formData.get('category') as string) || 'Kulis';
    const file = formData.get('image') as File | null;
    const pdfFile = formData.get('pdf') as File | null;

    const isAcademic = category === 'Makale' || formData.get('isAcademic') === 'true';
    const abstract = (formData.get('abstract') as string) || excerpt;
    const authorAffiliation = (formData.get('authorAffiliation') as string) || 'Fatih Sultan Mehmet Vakıf Üniversitesi';
    const journalTitle = (formData.get('journalTitle') as string) || 'FSM Tiyatro ve Sahne Sanatları Güncesi';
    const keywordsRaw = (formData.get('keywords') as string) || '';
    const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];

    if (!title || !content) {
      return { error: "Başlık ve içerik alanları zorunludur." };
    }

    const { session, user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'EDITOR', 'DIRECTOR', 'AKTOR', 'PLAYER', 'MEMBER']);
    const postDoc = await adminDb.collection('posts').doc(postId).get();
    if (!postDoc.exists) {
      return { error: "Düzenlenmek istenen yazı bulunamadı." };
    }

    const postData = postDoc.data()!;
    const isOwner = !!(postData.authorEmail && session?.user?.email && postData.authorEmail.toLowerCase() === session.user.email.toLowerCase());
    const userTitles: string[] = Array.isArray(user.titles) ? user.titles : [];
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role) || userTitles.some(t => t.includes('Admin') || t.includes('Yönetici'));

    if (!isOwner && !isAdmin) {
      return { error: "Bu yazıyı düzenleme yetkiniz bulunmamaktadır." };
    }

    let imageUrl = postData.imageUrl || null;
    if (file && file.size > 0) {
      if (postData.imageUrl) {
        try {
          await deleteStorageFile(postData.imageUrl);
        } catch {}
      }
      imageUrl = await uploadToStorage(file, 'posts');
    }

    let pdfUrl = postData.academicMeta?.pdfUrl || null;
    if (pdfFile && pdfFile.size > 0) {
      if (postData.academicMeta?.pdfUrl) {
        try {
          await deleteStorageFile(postData.academicMeta.pdfUrl);
        } catch {}
      }
      pdfUrl = await uploadToStorage(pdfFile, 'academic-papers');
    }

    const updatedData: Record<string, any> = {
      title,
      content,
      excerpt,
      category,
      imageUrl: imageUrl || null,
      academicMeta: isAcademic ? {
        isAcademic: true,
        abstract,
        authorAffiliation,
        journalTitle,
        publisher: 'Fatih Sultan Mehmet Vakıf Üniversitesi',
        keywords,
        pdfUrl: pdfUrl || null,
      } : null,
      updatedAt: new Date().toISOString()
    };

    await postDoc.ref.update(updatedData);

    revalidatePath('/');
    revalidatePath('/kulis');
    revalidatePath(`/kulis/${postId}`);
    revalidatePath('/members');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    return handleServerError(error, "UPDATE_POST");
  }
  redirect(`/kulis/${targetPostId}`);
}


export async function addPlay(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const playwright = (formData.get('playwright') as string) || '';
    const director = (formData.get('director') as string) || '';
    const season = (formData.get('season') as string) || `${new Date().getFullYear()}–${new Date().getFullYear() + 1}`;
    const genre = (formData.get('genre') as string) || 'Tiyatro Oyunu';
    const duration = (formData.get('duration') as string) || '';
    const year = (formData.get('year') as string) || new Date().getFullYear().toString();
    const stageLocation = (formData.get('stageLocation') as string) || 'Haliç Yerleşkesi Konferans Salonu';
    const directorNote = (formData.get('directorNote') as string) || '';
    const status = (formData.get('status') as 'ACTIVE' | 'ARCHIVED' | 'UPCOMING') || 'ACTIVE';
    const videoUrl = (formData.get('videoUrl') as string) || '';
    
    const file = formData.get('image') as File | null;
    const posterFile = formData.get('poster') as File | null;
    const galleryFiles = formData.getAll('gallery') as File[];

    if (!title || !description) {
      return { error: "Oyun adı ve açıklaması zorunludur." };
    }

    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);

    let imageUrl = "";
    if (file && file.size > 0) {
      imageUrl = await uploadToStorage(file, 'plays');
    }

    let posterUrl = "";
    if (posterFile && posterFile.size > 0) {
      posterUrl = await uploadToStorage(posterFile, 'plays/posters');
    }

    const uploadedGalleryUrls: string[] = [];
    if (galleryFiles && galleryFiles.length > 0) {
      for (const gFile of galleryFiles) {
        if (gFile && gFile.size > 0) {
          const gUrl = await uploadToStorage(gFile, 'plays/gallery');
          uploadedGalleryUrls.push(gUrl);
        }
      }
    }

    // Cast ve Crew JSON parsing (varsa)
    const rawCast = formData.get('castJson') as string;
    const rawCrew = formData.get('crewJson') as string;
    const rawDates = formData.get('datesJson') as string;

    let cast = [];
    let crew = [];
    let showDates = [];

    if (rawCast) {
      try { cast = JSON.parse(rawCast); } catch (e) { return { error: "Oyuncu listesi (Cast) geçerli bir JSON değil." }; }
    }
    if (rawCrew) {
      try { crew = JSON.parse(rawCrew); } catch (e) { return { error: "Ekip listesi (Crew) geçerli bir JSON değil." }; }
    }
    if (rawDates) {
      try { showDates = JSON.parse(rawDates); } catch (e) { return { error: "Oyun tarihleri geçerli bir JSON değil." }; }
    }

    // Senaryo / Metin PDF dosyası
    const scriptFile = formData.get('scriptPdf') as File | null;
    let scriptUrl = "";
    if (scriptFile && scriptFile.size > 0) {
      scriptUrl = await uploadToStorage(scriptFile, 'plays/scripts');
    }

    await adminDb.collection('plays').add({
      title,
      description,
      playwright,
      director,
      season,
      genre,
      duration,
      year,
      stageLocation,
      directorNote,
      status,
      cast,
      crew,
      showDates,
      scriptUrl: scriptUrl || null,
      imageUrl: imageUrl || null,
      posterUrl: posterUrl || null,
      videoUrl: videoUrl || null,
      galleryUrls: uploadedGalleryUrls.join(','),
      createdAt: new Date().toISOString()
    });

    revalidatePath('/');
    revalidatePath('/oyunlar');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    return handleServerError(error, "ADD_PLAY");
  }
  redirect('/oyunlar');
}

export async function updatePlay(formData: FormData) {
  try {
    const playId = formData.get('playId') as string;
    if (!playId) return { error: "Oyun ID gereklidir." };

    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const playwright = (formData.get('playwright') as string) || '';
    const director = (formData.get('director') as string) || '';
    const season = (formData.get('season') as string) || '';
    const genre = (formData.get('genre') as string) || 'Tiyatro Oyunu';
    const duration = (formData.get('duration') as string) || '';
    const year = (formData.get('year') as string) || '';
    const stageLocation = (formData.get('stageLocation') as string) || '';
    const directorNote = (formData.get('directorNote') as string) || '';
    const status = (formData.get('status') as 'ACTIVE' | 'ARCHIVED' | 'UPCOMING') || 'UPCOMING';
    const videoUrl = (formData.get('videoUrl') as string) || '';

    const playDoc = await adminDb.collection('plays').doc(playId).get();
    if (!playDoc.exists) return { error: "Oyun bulunamadı." };
    const existing = playDoc.data()!;

    // Dosyalar
    const file = formData.get('image') as File | null;
    const posterFile = formData.get('poster') as File | null;
    const scriptFile = formData.get('scriptPdf') as File | null;

    let imageUrl = existing.imageUrl;
    if (file && file.size > 0) {
      if (existing.imageUrl) await deleteStorageFile(existing.imageUrl);
      imageUrl = await uploadToStorage(file, 'plays');
    }

    let posterUrl = existing.posterUrl;
    if (posterFile && posterFile.size > 0) {
      if (existing.posterUrl) await deleteStorageFile(existing.posterUrl);
      posterUrl = await uploadToStorage(posterFile, 'plays/posters');
    }

    let scriptUrl = existing.scriptUrl;
    if (scriptFile && scriptFile.size > 0) {
      if (existing.scriptUrl) await deleteStorageFile(existing.scriptUrl);
      scriptUrl = await uploadToStorage(scriptFile, 'plays/scripts');
    }

    // Cast / Crew / Dates
    const rawCast = formData.get('castJson') as string;
    const rawCrew = formData.get('crewJson') as string;
    const rawDates = formData.get('datesJson') as string;

    let cast = existing.cast || [];
    let crew = existing.crew || [];
    let showDates = existing.showDates || [];

    if (rawCast) {
      try { cast = JSON.parse(rawCast); } catch {}
    }
    if (rawCrew) {
      try { crew = JSON.parse(rawCrew); } catch {}
    }
    if (rawDates) {
      try { showDates = JSON.parse(rawDates); } catch {}
    }

    await adminDb.collection('plays').doc(playId).update({
      title: title || existing.title,
      description: description || existing.description,
      playwright,
      director,
      season,
      genre,
      duration,
      year,
      stageLocation,
      directorNote,
      status,
      cast,
      crew,
      showDates,
      scriptUrl: scriptUrl || null,
      imageUrl: imageUrl || null,
      posterUrl: posterUrl || null,
      videoUrl: videoUrl || null,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/');
    revalidatePath('/oyunlar');
    revalidatePath(`/oyunlar/${playId}`);
    revalidatePath('/tanerabi/dashboard');
    revalidatePath('/members');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPDATE_PLAY");
  }
}

export async function getAIAnalysis(title: string, content: string, category: string) {
  try {
    const { analyzeArticleWithAI } = await import('@/lib/ai');
    return await analyzeArticleWithAI(title, content, category);
  } catch (error) {
    return { error: "Yapay zeka analiz servisi çağrılamadı." };
  }
}

export async function deletePlay(formData: FormData) {
  const playId = formData.get('playId') as string;
  if (!playId) return;

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);
    const playDoc = await adminDb.collection('plays').doc(playId).get();
    if (!playDoc.exists) return;

    const playData = playDoc.data()!;
    if (playData.imageUrl) {
      await deleteStorageFile(playData.imageUrl);
    }
    if (playData.posterUrl) {
      await deleteStorageFile(playData.posterUrl);
    }
    if (playData.galleryUrls) {
      const gUrls = (playData.galleryUrls as string).split(',');
      for (const gUrl of gUrls) {
        if (gUrl.trim()) await deleteStorageFile(gUrl.trim());
      }
    }

    await playDoc.ref.delete();
    revalidatePath('/');
    revalidatePath('/oyunlar');
    revalidatePath('/sitemap.xml');
  } catch (error) {
    handleServerError(error, "DELETE_PLAY");
  }
}

export async function updatePlayStatus(formData: FormData) {
  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR']);
    const playId = formData.get('playId') as string;
    const newStatus = formData.get('status') as string;

    if (!playId || !newStatus) return;

    await adminDb.collection('plays').doc(playId).update({
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/');
    revalidatePath('/oyunlar');
    revalidatePath('/tanerabi/dashboard');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPDATE_PLAY_STATUS");
  }
}

export async function toggleLike(postId: string) {
  try {
    const { session } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    const userEmail = session.user?.email;
    if (!userEmail) return { error: 'Oturum açılmalıdır.' };

    const postRef = adminDb.collection('posts').doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) return { error: 'Yazı bulunamadı.' };

    const likes: string[] = postSnap.data()?.likes || [];
    let updatedLikes: string[];

    if (likes.includes(userEmail)) {
      updatedLikes = likes.filter(e => e !== userEmail);
    } else {
      updatedLikes = [...likes, userEmail];
    }

    await postRef.update({ likes: updatedLikes });
    revalidatePath(`/blog/${postId}`);
    revalidatePath(`/yayin/${postId}`);
    return { success: true, likes: updatedLikes };
  } catch (error) {
    return handleServerError(error, "TOGGLE_LIKE");
  }
}

export async function addComment(formData: FormData) {
  try {
    const postId = formData.get('postId') as string;
    const content = formData.get('content') as string;

    if (!postId || !content || content.trim().length === 0) {
      return { error: 'Yorum içeriği boş olamaz.' };
    }

    const { user } = await requireAuth(['MEMBER', 'AKTOR', 'EDITOR', 'DIRECTOR', 'ASST_DIRECTOR', 'ADMIN', 'SUPERADMIN']);
    const authorName = [user.name, user.surname].filter(Boolean).join(' ') || user.email.split('@')[0];
    const authorTitle = user.displayTitle || (Array.isArray(user.titles) && user.titles[0]) || (user.role === 'MEMBER' ? 'Kulüp Üyesi' : user.role);

    const commentData = {
      content: content.trim(),
      authorName,
      authorEmail: user.email,
      authorPhoto: user.photoUrl || null,
      authorTitle: authorTitle || null,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection('posts').doc(postId).collection('comments').add(commentData);
    revalidatePath(`/kulis/${postId}`);
    revalidatePath(`/blog/${postId}`);
    revalidatePath(`/yayin/${postId}`);
    return { success: true };
  } catch (error) {
    return handleServerError(error, "ADD_COMMENT");
  }
}

export async function uploadScript(formData: FormData) {
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;

  if (!file || !title) return { error: "Eksik bilgi gönderildi." };

  try {
    const { user } = await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    const publicUrl = await uploadToStorage(file, 'scripts');
    const authorName = [user.name, user.surname].filter(Boolean).join(' ') || user.email;

    await adminDb.collection('scripts').add({
      title,
      fileUrl: publicUrl,
      author: authorName,
      authorEmail: user.email,
      createdAt: new Date().toISOString()
    });

    revalidatePath('/members');
    revalidatePath('/members/scripts');
    return { success: true };
  } catch (error) {
    return handleServerError(error, "UPLOAD_SCRIPT");
  }
}

export async function deleteScript(formData: FormData) {
  const scriptId = formData.get('scriptId') as string;
  if (!scriptId) return;

  try {
    await requireAuth(['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ASST_DIRECTOR']);
    const scriptDoc = await adminDb.collection('scripts').doc(scriptId).get();
    if (!scriptDoc.exists) return;

    const data = scriptDoc.data()!;
    if (data.fileUrl) {
      await deleteStorageFile(data.fileUrl);
    }

    await scriptDoc.ref.delete();
    revalidatePath('/members');
    revalidatePath('/members/scripts');
  } catch (error) {
    handleServerError(error, "DELETE_SCRIPT");
  }
}
