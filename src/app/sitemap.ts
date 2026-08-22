import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/oyunlar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/etkinlikler`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kulis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kulup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/katil`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/biletimi-bul`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    const [playsSnap, postsSnap] = await Promise.all([
      adminDb.collection('plays').get(),
      adminDb.collection('posts').get(),
    ]);

    const playPages: MetadataRoute.Sitemap = playsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/oyunlar/${doc.id}`,
        lastModified: data.createdAt ? new Date(data.createdAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      };
    });

    const postPages: MetadataRoute.Sitemap = postsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/kulis/${doc.id}`,
        lastModified: data.createdAt ? new Date(data.createdAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      };
    });

    return [...staticPages, ...playPages, ...postPages];
  } catch (error) {
    console.error('[SITEMAP] Veri çekme hatası:', error);
    return staticPages;
  }
}
