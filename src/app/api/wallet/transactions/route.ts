import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateWallet, getTransactions, TransactionFilters } from '@/lib/wallet/service';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await getOrCreateWallet(currentUser.id);
    const { searchParams } = new URL(req.url);

    const filters: TransactionFilters = {
      walletId: wallet.id,
      type: searchParams.get('type') as any,
      status: searchParams.get('status') as any,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await getTransactions(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to get transactions' },
      { status: 500 }
    );
  }
}
