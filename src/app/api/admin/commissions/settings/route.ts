import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

// GET: Fetch current commission settings
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('commission:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const settings = await prisma.commission.findMany();
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Get commission settings error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Update commission setting parameters
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('commission:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { id, percentage, fixedAmount, isActive } = body;

    if (!id) {
      return NextResponse.json({ message: 'Setting id is required' }, { status: 400 });
    }

    const setting = await prisma.commission.findUnique({
      where: { id },
    });

    if (!setting) {
      return NextResponse.json({ message: 'Commission setting not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof percentage === 'number') updateData.percentage = percentage;
    if (typeof fixedAmount === 'number') updateData.fixedAmount = fixedAmount;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updated = await prisma.commission.update({
      where: { id },
      data: updateData,
    });

    // Log action to Audit logs
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'UPDATE_COMMISSION_SETTING',
        targetType: 'Commission',
        targetId: id,
        details: `Updated ${setting.type} commission setting parameters: ${JSON.stringify(updateData)}`,
      },
    });

    return NextResponse.json({
      message: 'Commission setting updated successfully',
      setting: updated,
    });
  } catch (error: any) {
    console.error('Update commission settings error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
