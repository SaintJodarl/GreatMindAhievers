import type { Metadata } from 'next';
import LandingPageClient from './_components/LandingPageClient';

const title = 'Great Mind Achievers | Nigerian Empowerment Community';
const description =
  'Great Mind Achievers is a Nigerian empowerment community helping members access business support, agricultural opportunities, financial programs, and shared growth.';

export const metadata: Metadata = {
  metadataBase: new URL('https://greatmindachievers.org'),
  title,
  description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Great Mind Achievers',
    locale: 'en_NG',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 514,
        height: 486,
        alt: 'Great Mind Achievers Initiatives logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/assets/images/app_logo.png'],
  },
};

export default function HomePage() {
  return <LandingPageClient />;
}
