import { NextRequest } from 'next/server';
import { POST as reviewPost } from '../route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return reviewPost(req, { params });
}
