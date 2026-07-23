import React from 'react';
import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPrivatePageMetadata(
  'Member Login',
  'Private Great Mind Achievers login and registration page.'
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
