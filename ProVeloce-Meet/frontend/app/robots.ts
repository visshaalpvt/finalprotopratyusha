import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/sign-in',
          '/sign-up',
          '/previous',
          '/upcoming',
        ],
        disallow: [
          '/meeting/', // Private meetings - no indexing
          '/api/',
          '/_next/',
          '/host/',
          '/user/',
          '/recordings/', // Private recordings
          '/history/', // Private user history
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/sign-in',
          '/sign-up',
        ],
        disallow: [
          '/meeting/',
          '/api/',
          '/host/',
          '/user/',
          '/recordings/',
          '/history/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

