import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import crypto from 'crypto';

// GET: List activation codes (paginated, with search & status filters)
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('code:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all'; // all, UNUSED, USED, REVOKED, EXPIRED, DISABLED
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const activationWhere: any = {};
    if (status !== 'all') {
      activationWhere.status = status;
    }
    if (search) {
      activationWhere.code = { contains: search, mode: 'insensitive' };
    }

    const [activationCodesResult, totalCount] = await Promise.all([
      prisma.activationCode.findMany({
        where: activationWhere,
        include: {
          redeemedUser: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdDate: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.activationCode.count({ where: activationWhere }),
    ]);

    const codes = activationCodesResult.map((c) => ({
      id: c.id,
      code: c.code,
      type: 'ACTIVATION',
      status: c.status,
      createdAt: c.createdDate,
      regUser: c.redeemedUser,
      kycUser: null,
      createdBy: c.createdBy,
      expirationDate: c.expirationDate,
    }));

    return NextResponse.json({
      codes,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('List codes error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Generate bulk activation codes
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('code:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const { count = 1, prefix = 'GMA-', expirationDays } = body;

    const generatedCodes = [];
    const expirationDate = expirationDays ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000) : null;

    const batchCodes = new Set<string>();

    for (let i = 0; i < count; i++) {
      let codeStr = '';
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 100) {
        const randomDigits = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
        codeStr = `GMA-${randomDigits}`;

        if (!batchCodes.has(codeStr)) {
          // Check database collision
          const exists = await prisma.activationCode.findUnique({
            where: { code: codeStr },
          });
          if (!exists) {
            isUnique = true;
          }
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Collision limit reached. Failed to generate a unique activation code.');
      }

      batchCodes.add(codeStr);

      generatedCodes.push({
        code: codeStr,
        status: 'UNUSED',
        createdBy: auth.user!.id,
        expirationDate,
      });
    }

    await prisma.$transaction(
      generatedCodes.map((c) =>
        prisma.activationCode.create({
          data: c,
        })
      )
    );

    // Log this action to audit logs
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'GENERATE_CODES',
        targetType: 'ActivationCode',
        details: `Generated ${count} Activation codes with prefix ${prefix}`,
      },
    });

    return NextResponse.json(
      {
        message: `Successfully generated ${count} codes`,
        codes: generatedCodes.map((c) => ({ code: c.code, type: 'ACTIVATION', status: c.status })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Generate codes error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
