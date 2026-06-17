import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { v4 as uuidv4 } from 'uuid';

// GET: List codes (paginated, with search & status filters)
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
    const type = searchParams.get('type') || 'all'; // all, REGISTRATION, KYC, ACTIVATION
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 1. Fetch activation codes specifically
    if (type === 'ACTIVATION') {
      const activationWhere: any = {};
      if (status !== 'all') {
        activationWhere.status = status;
      }
      if (search) {
        activationWhere.code = { contains: search };
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
    }

    // 2. Fetch registration or KYC codes specifically
    if (type === 'REGISTRATION' || type === 'KYC') {
      const where: any = { type };
      if (status !== 'all') {
        where.status = status;
      }
      if (search) {
        where.code = { contains: search };
      }

      const [codesResult, totalCount] = await Promise.all([
        prisma.adminCode.findMany({
          where,
          include: {
            regUser: { select: { id: true, name: true, email: true } },
            kycUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.adminCode.count({ where }),
      ]);

      const codes = codesResult.map((c) => ({
        ...c,
        createdBy: 'SYSTEM',
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
    }

    // 3. Fetch all codes merged
    const adminWhere: any = {};
    const activationWhere: any = {};

    if (status !== 'all') {
      adminWhere.status = status;
      activationWhere.status = status;
    }
    if (search) {
      adminWhere.code = { contains: search };
      activationWhere.code = { contains: search };
    }

    const [adminCodesResult, activationCodesResult] = await Promise.all([
      prisma.adminCode.findMany({
        where: adminWhere,
        include: {
          regUser: { select: { id: true, name: true, email: true } },
          kycUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.activationCode.findMany({
        where: activationWhere,
        include: {
          redeemedUser: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const mappedActivationCodes = activationCodesResult.map((c) => ({
      id: c.id,
      code: c.code,
      type: 'ACTIVATION',
      status: c.status,
      createdAt: c.createdDate,
      regUser: c.redeemedUser,
      kycUser: null,
      createdBy: c.createdBy,
    }));

    const mappedAdminCodes = adminCodesResult.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      status: c.status,
      createdAt: c.createdAt,
      regUser: c.regUser,
      kycUser: c.kycUser,
      createdBy: 'SYSTEM',
    }));

    const allCodes = [...mappedAdminCodes, ...mappedActivationCodes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = allCodes.length;
    const paginatedCodes = allCodes.slice(offset, offset + limit);

    return NextResponse.json({
      codes: paginatedCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

// POST: Generate single or bulk codes
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('code:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { type, count = 1, prefix = 'NG-', expirationDays } = body;

    if (!type || !['REGISTRATION', 'KYC', 'ACTIVATION'].includes(type)) {
      return NextResponse.json({ message: 'Invalid or missing code type' }, { status: 400 });
    }

    const generatedCodes = [];
    const expirationDate = expirationDays ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000) : null;

    if (type === 'ACTIVATION') {
      for (let i = 0; i < count; i++) {
        const uniqueSuffix = uuidv4().slice(0, 8).toUpperCase();
        const codeStr = `${prefix}ACT${uniqueSuffix}`;

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
    } else {
      for (let i = 0; i < count; i++) {
        const typeAbbr = type === 'REGISTRATION' ? 'REG' : 'KYC';
        const uniqueSuffix = uuidv4().slice(0, 8).toUpperCase();
        const codeStr = `${prefix}${typeAbbr}${uniqueSuffix}`;

        generatedCodes.push({
          code: codeStr,
          type,
          status: 'UNUSED',
        });
      }

      await prisma.$transaction(
        generatedCodes.map((c) =>
          prisma.adminCode.create({
            data: c,
          })
        )
      );
    }

    // Log this action to audit logs
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'GENERATE_CODES',
        targetType: type === 'ACTIVATION' ? 'ActivationCode' : 'AdminCode',
        details: `Generated ${count} codes of type ${type} with prefix ${prefix}`,
      },
    });

    return NextResponse.json(
      {
        message: `Successfully generated ${count} codes`,
        codes: generatedCodes.map((c) => ({ code: c.code, type, status: c.status })),
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
