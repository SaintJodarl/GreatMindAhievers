import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('kyc:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const submission = await prisma.kYCSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ message: 'KYC submission not found' }, { status: 404 });
    }

    if (submission.status !== 'SUBMITTED') {
      return NextResponse.json(
        { message: 'KYC submission has already been reviewed' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    }

    return NextResponse.json(
      {
        message:
          'Reject a specific KYC document from the document review endpoint instead of rejecting the whole submission.',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Reject KYC error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
