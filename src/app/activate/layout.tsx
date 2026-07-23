import React from 'react';
import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPrivatePageMetadata(
  'Activate Account',
  'Private account activation page for Great Mind Achievers members.'
);

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
