import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import {
  buildOfficialMemberRegisterWorkbook,
  formatGeneratedDate,
  formatGeneratedTime,
  formatOfficialMemberRegisterFileName,
  loadOfficialMemberRegisterRows,
} from '@/lib/official-member-register/export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('member:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const generatedAt = new Date();
    const generatedBy = formatAdminLabel(auth.user);
    const fileName = formatOfficialMemberRegisterFileName(generatedAt);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || null;
    const rows = await loadOfficialMemberRegisterRows(prisma);

    const workbook = buildOfficialMemberRegisterWorkbook({
      rows,
      generatedAt,
      generatedBy,
    });

    await prisma.auditLog.create({
      data: {
        adminId: auth.user?.id || 'UNKNOWN_ADMIN',
        action: 'EXPORT_OFFICIAL_MEMBER_REGISTER',
        targetType: 'OfficialMemberRegister',
        targetId: fileName,
        details: JSON.stringify({
          administrator: generatedBy,
          date: formatGeneratedDate(generatedAt),
          time: formatGeneratedTime(generatedAt),
          fileName,
          exportedMembers: rows.length,
          ipAddress,
        }),
        ipAddress,
        userAgent,
      },
    });

    return new NextResponse(new Uint8Array(workbook), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': workbook.byteLength.toString(),
        'X-Exported-Member-Count': rows.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('Official member register export error:', error);
    const status = getErrorStatus(error);

    return NextResponse.json(
      {
        message:
          status >= 500
            ? 'Failed to export official member register'
            : getErrorMessage(error, 'Failed to export official member register'),
      },
      { status }
    );
  }
}

function formatAdminLabel(user: Awaited<ReturnType<typeof verifyAdminPermission>>['user']): string {
  if (!user) return 'Unknown Administrator';
  const identity = user.email || user.id;
  return user.name ? `${user.name} (${identity})` : identity;
}

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    null
  );
}

function getErrorStatus(error: unknown): number {
  const status = Number(getErrorRecord(error)?.statusCode);
  return Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const message = getErrorRecord(error)?.message;
  return typeof message === 'string' && message ? message : fallback;
}

function getErrorRecord(error: unknown): Record<string, unknown> | null {
  return typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null;
}
