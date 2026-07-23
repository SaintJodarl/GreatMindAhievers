import type { Metadata } from 'next';
import { StructuredData } from '@/components/StructuredData';
import { createPageMetadata, homeStructuredData, siteConfig } from '@/lib/seo';
import LandingPageClient from './_components/LandingPageClient';

export const metadata: Metadata = createPageMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: '/',
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <StructuredData data={homeStructuredData} />
      <LandingPageClient />
    </>
  );
}
