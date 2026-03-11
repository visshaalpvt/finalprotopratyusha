'use client';

import { useEffect } from 'react';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'video';
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: object;
}

const defaultTitle = 'ProVeloce Meet';
const defaultDescription = 'Professional video conferencing software for businesses. Host secure online meetings with real-time collaboration, meeting recording, and participant analytics. Browser-based WebRTC solution.';
const defaultKeywords = [
  'secure online meeting platform',
  'real-time video calling app',
  'business video conferencing software',
  'remote collaboration tool',
  'host controlled meeting system',
  'browser-based WebRTC solution',
  'meeting recording and history tracking',
  'cloud meeting dashboard',
  'participant attendance analytics',
  'video conferencing',
  'online meetings',
  'virtual meetings',
  'team collaboration',
];

export default function SEOHead({
  title,
  description,
  keywords = [],
  ogImage,
  ogType = 'website',
  canonicalUrl,
  noindex = false,
  structuredData,
}: SEOHeadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  const fullTitle = title ? `${title} | ProVeloce Meet` : defaultTitle;
  const fullDescription = description || defaultDescription;
  const allKeywords = [...defaultKeywords, ...keywords].join(', ');
  const imageUrl = ogImage || `${baseUrl}/og-image.png`;
  const canonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : baseUrl);

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', fullDescription);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', allKeywords);

    // Update canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // Update or create Open Graph tags
    const ogTags = [
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: fullDescription },
      { property: 'og:type', content: ogType },
      { property: 'og:image', content: imageUrl },
      { property: 'og:url', content: canonical },
      { property: 'og:site_name', content: 'ProVeloce Meet' },
    ];

    ogTags.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: fullDescription },
      { name: 'twitter:image', content: imageUrl },
    ];

    twitterTags.forEach(({ name, content }) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Robots meta tag
    if (noindex) {
      let robotsTag = document.querySelector('meta[name="robots"]');
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsTag);
      }
      robotsTag.setAttribute('content', 'noindex, nofollow');
    }

    // Add structured data (JSON-LD)
    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('data-seo', 'true');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }
  }, [fullTitle, fullDescription, allKeywords, imageUrl, canonical, ogType, noindex, structuredData]);

  return null;
}

