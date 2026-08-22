'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAuth, deleteStorageFile, uploadToStorage } from './common';

export async function addPost(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const excerpt = (formData.get('excerpt') as string) || content.slice(0, 160);
    const category = (formData.get('category') as string) || 'Blog';
    const file = formData.get('image') as File | null;
    const pdfFile = formData.get('pdf') as File | null;
    
    // Akademik Metadata Alanları (Google Scholar için)
    const isAcademic = formData.get('isAcademic') === 'true' || category === 'Akademik Bildiri';
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
    revalidatePath('/blog');
    revalidatePath('/yayin');
    revalidatePath('/sitemap.xml');
  } catch (error: any) {
    console.error("[ADD_POST] Hata:", error);
    return { error: error.message || "Yazı eklenirken hata oluştu." };
  }
  redirect('/yayin');
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
    revalidatePath('/blog');
    revalidatePath('/yayin');
    revalidatePath('/sitemap.xml');
  } catch (error: any) {
    console.error("[DELETE_POST] Hata:", error);
  }
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
      try { cast = JSON.parse(rawCast); } catch (e) {}
    }
    if (rawCrew) {
      try { crew = JSON.parse(rawCrew); } catch (e) {}
    }
    if (rawDates) {
      try { showDates = JSON.parse(rawDates); } catch (e) {}
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
      imageUrl: imageUrl || null,
      posterUrl: posterUrl || null,
      videoUrl: videoUrl || null,
      galleryUrls: uploadedGalleryUrls.join(','),
      createdAt: new Date().toISOString()
    });

    revalidatePath('/');
    revalidatePath('/plays');
    revalidatePath('/sahne');
    revalidatePath('/arsiv');
    revalidatePath('/sitemap.xml');
  } catch (error: any) {
    console.error("[ADD_PLAY] Hata:", error);
    return { error: error.message || "Oyun eklenirken bir hata oluştu." };
  }
  redirect('/sahne');
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
    revalidatePath('/plays');
    revalidatePath('/sahne');
    revalidatePath('/arsiv');
    revalidatePath('/sitemap.xml');
  } catch (error: any) {
    console.error("[DELETE_PLAY] Hata:", error);
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
  } catch (error: any) {
    return { error: error.message };
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

    const commentData = {
      content: content.trim(),
      authorName,
      authorEmail: user.email,
      authorPhoto: user.photoUrl || null,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection('posts').doc(postId).collection('comments').add(commentData);
    revalidatePath(`/blog/${postId}`);
    revalidatePath(`/yayin/${postId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
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
  } catch (error: any) {
    return { error: error.message };
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
  } catch (error: any) {
    console.error("[DELETE_SCRIPT] Hata:", error);
  }
}
