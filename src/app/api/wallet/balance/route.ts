import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getOrCreateWallet, getWalletBalance } from '@/lib/wallet/service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await getOrCreateWallet(session.user.id);
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
