import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { getStageDisplayName } from '@/lib/qualification/constants';

// Check if user is admin
async function isAdmin(session: any) {
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [claims, loans] = await Promise.all([
      prisma.rewardClaim.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              currentStage: true,
              bankName: true,
              accountNumber: true,
              accountName: true,
            },
          },
          reward: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stageLoan.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              currentStage: true,
            },
          },
          auditEntries: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      claims: claims.map((claim) => ({
        ...claim,
        user: {
          ...claim.user,
          currentStageName: getStageDisplayName(claim.user.currentStage),
        },
        reward: {
          ...claim.reward,
          stageName: getStageDisplayName(claim.reward.stage),
        },
      })),
      loans: loans.map((loan) => ({
        ...loan,
        stageName: getStageDisplayName(loan.stage),
        user: {
          ...loan.user,
          currentStageName: getStageDisplayName(loan.user.currentStage),
        },
      })),
    });
  } catch (error: any) {
    console.error('Error fetching claims:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { claimId, loanId, status, adminNote, amountRepaid } = await req.json();

    if (loanId) {
      if (!['ISSUED', 'IN_REPAYMENT', 'REPAID', 'DEFAULTED', 'CANCELLED'].includes(status)) {
        return new NextResponse('Invalid loan status', { status: 400 });
      }

      const loan = await prisma.stageLoan.findUnique({
        where: { id: loanId },
      });

      if (!loan) {
        return new NextResponse('Loan not found', { status: 404 });
      }

      const nextAmountRepaid =
        amountRepaid === undefined || amountRepaid === null ? loan.amountRepaid : amountRepaid;
      const outstandingBalance = loan.totalRepayable.minus(nextAmountRepaid);

      const updatedLoan = await prisma.$transaction(async (tx) => {
        const updated = await tx.stageLoan.update({
          where: { id: loanId },
          data: {
            status,
            amountRepaid: nextAmountRepaid,
            outstandingBalance: outstandingBalance.isNegative() ? 0 : outstandingBalance,
          },
        });

        await tx.stageLoanAudit.create({
          data: {
            loanId,
            adminId: session!.user!.id,
            action: `STATUS_${status}`,
            details:
              adminNote ||
              `Loan status updated to ${status}. Amount repaid: ${nextAmountRepaid.toString()}.`,
          },
        });

        return updated;
      });

      return NextResponse.json(updatedLoan);
    }

    if (
      !claimId ||
      !['PROCESSING', 'PAID', 'FULFILLED', 'REJECTED', 'CANCELLED'].includes(status)
    ) {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    const updatedClaim = await prisma.rewardClaim.update({
      where: { id: claimId },
      data: {
        status,
        adminNote,
        processedByAdminId: session!.user!.id,
        processedAt: new Date(),
      },
    });

    return NextResponse.json(updatedClaim);
  } catch (error: any) {
    console.error('Error processing claim:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
