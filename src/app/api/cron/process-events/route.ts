import { NextRequest, NextResponse } from 'next/server';
import { processOutboxEvents } from '@/lib/events/processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed for Vercel Pro

export async function GET(req: NextRequest) {
  // Enforce Vercel Cron Security
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const processedCount = await processOutboxEvents();
    return NextResponse.json({ success: true, processedCount });
  } catch (error: any) {
    console.error('Cron Event Processor Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
