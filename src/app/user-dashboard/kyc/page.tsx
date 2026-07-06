'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * /user-dashboard/kyc — redirects to the complete registration wizard.
 * The old document-upload UI has been removed per updated business requirements.
 * KYC is now registration completion (personal + banking information only).
 */
export default function KycIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/user-dashboard/kyc/complete');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      <p className="text-sm text-gray-500">Redirecting to registration...</p>
    </div>
  );
}
