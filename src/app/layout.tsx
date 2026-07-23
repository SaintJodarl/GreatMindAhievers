import React from 'react';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import '../styles/tailwind.css';
import { Providers } from '@/components/Providers';
import { createPageMetadata, siteConfig } from '@/lib/seo';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d0f1a',
  colorScheme: 'dark light',
};

export const metadata: Metadata = {
  ...createPageMetadata({
    title: siteConfig.title,
    description: siteConfig.description,
    path: '/',
    absoluteTitle: true,
  }),
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'community empowerment',
  manifest: '/manifest.webmanifest',
  referrer: 'origin-when-cross-origin',
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: siteConfig.logo.path, type: 'image/png' },
    ],
    apple: [{ url: siteConfig.logo.path, type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.shortName,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={siteConfig.language} className={`${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
