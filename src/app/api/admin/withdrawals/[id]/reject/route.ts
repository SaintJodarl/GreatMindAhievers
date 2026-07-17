import { NextRequest } from 'next/server';
import { POST as processPost } from '../process/route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));

  const mockReq = new NextRequest(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({
      decision: 'reject',
      reason: body.reason,
      rejectionType: body.rejectionType,
    }),
  });
  return processPost(mockReq, { params });
}
