import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/author/*',
          '/student/*',
          '/dashboard/*',
          '/api/*',
          '/checkout/pending',
          '/admin-sign-in',
          '/author-sign-in',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
