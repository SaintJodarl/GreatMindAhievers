import { PrismaClient } from '@prisma/client';
import { generateReferralLink } from '../src/lib/referral-link';

export function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateUniqueReferralCode(prisma: any): Promise<string> {
  let code: string;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    code = generateReferralCode();
    const user = await prisma.user.findUnique({ where: { referralCode: code } });
    exists = !!user;
    attempts++;
  }

  if (exists) {
    throw new Error('Unable to generate unique referral code');
  }

  return code!;
}

const prisma = new PrismaClient();

async function main() {
  console.log('Starting referral code backfill...');

  const usersWithoutReferralCode = await prisma.user.findMany({
    where: {
      role: 'MEMBER',
      referralCode: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(`Found ${usersWithoutReferralCode.length} users without a referral code.`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutReferralCode) {
    try {
      const newReferralCode = await generateUniqueReferralCode(prisma);
      const newReferralLink = generateReferralLink(newReferralCode);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          referralCode: newReferralCode,
          referralLink: newReferralLink,
        },
      });

      console.log(
        `[SUCCESS] Backfilled user ${user.email} (Role: ${user.role}) with code ${newReferralCode}`
      );
      successCount++;
    } catch (error: any) {
      console.error(`[ERROR] Failed to backfill user ${user.id} (${user.email}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n--- Backfill Summary ---');
  console.log(`Total checked/needed: ${usersWithoutReferralCode.length}`);
  console.log(`Successfully backfilled: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log('------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
