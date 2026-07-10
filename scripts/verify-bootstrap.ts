import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APPROVED_SUPER_ADMIN_EMAILS = [
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com',
] as const;
const STARTUP_ACTIVATION_CODE = 'GMA-000001';
const BOOTSTRAP_REFERRAL_CODE = 'ROOT-PARENT-001';

async function main() {
  console.info('Verifying first-member bootstrap readiness...');

  const [approvedAdmins, normalMemberCount, activationCodes, bootstrapReferralUser] =
    await Promise.all([
      prisma.user.findMany({
        where: { email: { in: [...APPROVED_SUPER_ADMIN_EMAILS] } },
        select: { email: true, role: true, referralCode: true },
        orderBy: { email: 'asc' },
      }),
      prisma.user.count({
        where: {
          role: 'MEMBER',
          NOT: { email: { in: [...APPROVED_SUPER_ADMIN_EMAILS] } },
        },
      }),
      prisma.activationCode.findMany({
        select: { code: true, status: true, redeemedBy: true, expirationDate: true },
        orderBy: { code: 'asc' },
      }),
      prisma.user.findUnique({
        where: { referralCode: BOOTSTRAP_REFERRAL_CODE },
        select: { id: true },
      }),
    ]);

  for (const email of APPROVED_SUPER_ADMIN_EMAILS) {
    const admin = approvedAdmins.find((row) => row.email === email);
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      throw new Error(`Approved super admin is missing or not SUPER_ADMIN: ${email}`);
    }
    if (admin.referralCode) {
      throw new Error(`Approved super admin must not carry a member referral code: ${email}`);
    }
  }

  if (normalMemberCount !== 0) {
    throw new Error(
      `Expected zero normal members before first registration, found ${normalMemberCount}.`
    );
  }

  if (activationCodes.length !== 1 || activationCodes[0]?.code !== STARTUP_ACTIVATION_CODE) {
    throw new Error('Expected GMA-000001 to be the only activation code.');
  }

  const startupCode = activationCodes[0];
  if (startupCode.status !== 'UNUSED' || startupCode.redeemedBy || startupCode.expirationDate) {
    throw new Error('GMA-000001 must be unused, unredeemed, and non-expiring.');
  }

  if (bootstrapReferralUser) {
    throw new Error('ROOT-PARENT-001 must not exist as a real user referral code.');
  }

  console.info('Bootstrap readiness verified.');
  console.info(`First activation code: ${STARTUP_ACTIVATION_CODE}`);
  console.info(`One-time first-parent referral code: ${BOOTSTRAP_REFERRAL_CODE}`);
}

main()
  .catch((error) => {
    console.error('Bootstrap verification failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
