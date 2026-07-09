import { redirect } from 'next/navigation';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const ref = resolvedParams.ref || resolvedParams.sponsor;
  if (ref) {
    redirect(`/sign-up-login-screen?ref=${ref}`);
  } else {
    redirect('/sign-up-login-screen');
  }
}
