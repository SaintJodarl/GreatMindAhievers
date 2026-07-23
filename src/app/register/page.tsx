import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPrivatePageMetadata(
  'Register',
  'Redirects members to the Great Mind Achievers account creation page.'
);

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const ref = resolvedParams.ref || resolvedParams.sponsor;
  if (ref) {
    redirect(`/sign-up-login-screen?mode=register&ref=${ref}`);
  } else {
    redirect('/sign-up-login-screen');
  }
}
