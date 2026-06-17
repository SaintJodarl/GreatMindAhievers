import { NextRequest } from 'next/server';
import { POST as processPost } from '../process/route';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Map request to process route with approve decision
  const mockReq = new NextRequest(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ decision: 'approve' }),
  });
  return processPost(mockReq, { params });
}
