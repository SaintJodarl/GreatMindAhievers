import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('code:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    // Await params if it is a Promise (Next.js 15+ convention compatibility)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check ActivationCode
    const activationCode = await prisma.activationCode.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (activationCode) {
      if (activationCode.status === 'USED') {
        return NextResponse.json(
          { message: 'Cannot update a code that has already been used' },
          { status: 400 }
        );
      }

      const body = await req.json().catch(() => ({}));
      const targetStatus = body.status || 'DISABLED';

      const updated = await prisma.activationCode.update({
        where: { id: activationCode.id },
        data: { status: targetStatus },
      });

      // Log action to audit logs
      await prisma.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'UPDATE_ACTIVATION_CODE',
          targetType: 'ActivationCode',
          targetId: activationCode.id,
          details: `Updated activation code: ${activationCode.code} to status: ${targetStatus}`,
        },
      });

      return NextResponse.json({
        message: `Activation code updated successfully`,
        code: {
          id: updated.id,
          code: updated.code,
          type: 'ACTIVATION',
          status: updated.status,
          createdAt: updated.createdDate,
        },
      });
    }

    return NextResponse.json({ message: 'Code not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Revoke code error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
