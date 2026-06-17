import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';


import { getOrCreateWallet, getWalletBalance } from '@/lib/wallet/service';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await getOrCreateWallet(currentUser.id);
    const balance = await getWalletBalance(wallet.id);

    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to get balance' },
      { status: 500 }
    );
  }
}
