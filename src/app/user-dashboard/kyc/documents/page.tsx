'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * /user-dashboard/kyc/documents — this route previously showed KYC document submission status.
 * Document submission is no longer part of the KYC / Complete Registration flow.
 * Redirect to the complete registration wizard.
 */
export default function KycDocumentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/user-dashboard/kyc/complete');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      <p className="text-sm text-gray-500">Redirecting...</p>
    </div>
  );
}
