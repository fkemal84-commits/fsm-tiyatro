import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://fsmtiyatro.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/tanerabi/',
          '/tanerabi/dashboard/',
          '/members/',
          '/profile/',
          '/api/',
          '/reset-password',
        ],
      },
      {
        userAgent: 'Google-Scholar',
        allow: ['/blog/', '/blog/*'],
        disallow: ['/tanerabi/', '/members/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
