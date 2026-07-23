import type { MetadataRoute } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0d0f1a',
    theme_color: '#6c47ff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: siteConfig.logo.path,
        sizes: `${siteConfig.logo.width}x${siteConfig.logo.height}`,
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: absoluteUrl(siteConfig.ogImage.path),
        sizes: `${siteConfig.ogImage.width}x${siteConfig.ogImage.height}`,
        type: 'image/jpeg',
        form_factor: 'wide',
      },
    ],
  };
}
