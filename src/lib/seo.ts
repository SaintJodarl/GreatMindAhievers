import type { Metadata } from 'next';

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://greatmindachievers.org';

const siteUrl = rawSiteUrl.replace(/\/+$/, '');

export const siteConfig = {
  name: 'Great Mind Achievers',
  shortName: 'GMA',
  url: siteUrl,
  locale: 'en_NG',
  language: 'en-NG',
  title: 'Great Mind Achievers | Nigerian Empowerment Community',
  description:
    'Great Mind Achievers is a Nigerian empowerment community helping members access business support, agricultural opportunities, financial programs, and shared growth.',
  contactEmail: 'info@greatmindachievers.org',
  contactPhone: '+2347069211767',
  address: 'Suite 160, Doyin Plaza, off Okoko Bus-Stop, Ojo, Lagos, Nigeria',
  logo: {
    path: '/assets/images/app_logo.png',
    width: 514,
    height: 486,
    alt: 'Great Mind Achievers logo',
  },
  ogImage: {
    path: '/assets/images/2025/Hero Section Image.jpg',
    width: 2560,
    height: 1416,
    alt: 'Great Mind Achievers community leadership and members',
  },
};

export const landingFaqs = [
  {
    question: 'What is Great Mind Achievers?',
    answer:
      'Great Mind Achievers is a Nigerian empowerment community that supports members with teamwork, business support, agricultural opportunities, financial programs, and shared growth.',
  },
  {
    question: 'What programs can members access?',
    answer:
      'Members can access programs connected to entrepreneurship support, marketing empowerment, savings and loan support, agricultural partnerships, community initiatives, and partnership projects.',
  },
  {
    question: 'How do new members get started?',
    answer:
      'New members create an account, complete profile and verification details, join the empowerment network, and participate in available programs through the GMA community.',
  },
  {
    question: 'Where is Great Mind Achievers located?',
    answer:
      'Great Mind Achievers is located at Suite 160, Doyin Plaza, off Okoko Bus-Stop, Ojo, Lagos, Nigeria.',
  },
];

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, `${siteConfig.url}/`).toString();
}

export const publicRobots: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

export const privateRobots: Metadata['robots'] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

type PageMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  image?: typeof siteConfig.ogImage;
  type?: 'website' | 'article';
  noIndex?: boolean;
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  image = siteConfig.ogImage,
  type = 'website',
  noIndex = false,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image.path);

  return {
    metadataBase: new URL(siteConfig.url),
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
    },
    robots: noIndex ? privateRobots : publicRobots,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [
        {
          url: imageUrl,
          width: image.width,
          height: image.height,
          alt: image.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: image.alt,
        },
      ],
    },
  };
}

export function createPrivatePageMetadata(
  title: string,
  description = 'Private Great Mind Achievers member area.'
): Metadata {
  return {
    title,
    description,
    robots: privateRobots,
  };
}

export const homeStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${absoluteUrl('/')}#organization`,
      name: siteConfig.name,
      alternateName: siteConfig.shortName,
      url: absoluteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(siteConfig.logo.path),
        width: siteConfig.logo.width,
        height: siteConfig.logo.height,
      },
      image: absoluteUrl(siteConfig.ogImage.path),
      description: siteConfig.description,
      email: siteConfig.contactEmail,
      telephone: siteConfig.contactPhone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Suite 160, Doyin Plaza, off Okoko Bus-Stop',
        addressLocality: 'Ojo',
        addressRegion: 'Lagos',
        addressCountry: 'NG',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          telephone: siteConfig.contactPhone,
          email: siteConfig.contactEmail,
          areaServed: 'NG',
          availableLanguage: ['English'],
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${absoluteUrl('/')}#website`,
      name: siteConfig.name,
      alternateName: siteConfig.shortName,
      url: absoluteUrl('/'),
      inLanguage: siteConfig.language,
      publisher: {
        '@id': `${absoluteUrl('/')}#organization`,
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${absoluteUrl('/')}#webpage`,
      url: absoluteUrl('/'),
      name: siteConfig.title,
      description: siteConfig.description,
      inLanguage: siteConfig.language,
      isPartOf: {
        '@id': `${absoluteUrl('/')}#website`,
      },
      about: {
        '@id': `${absoluteUrl('/')}#organization`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: absoluteUrl(siteConfig.ogImage.path),
        width: siteConfig.ogImage.width,
        height: siteConfig.ogImage.height,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${absoluteUrl('/')}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: absoluteUrl('/'),
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${absoluteUrl('/')}#faq`,
      mainEntity: landingFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ],
};
