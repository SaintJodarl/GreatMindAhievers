import { NextRequest } from 'next/server';
import { POST as processPost } from '../process/route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Rejected by admin';

    const mockReq = new NextRequest(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify({ decision: 'reject', reason }),
    });
    return processPost(mockReq, { params });
  } catch (err: any) {
    const mockReq = new NextRequest(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify({ decision: 'reject', reason: 'Rejected by admin' }),
    });
    return processPost(mockReq, { params });
  }
}
