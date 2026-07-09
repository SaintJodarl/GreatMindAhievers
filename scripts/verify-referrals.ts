import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const allUsers = await prisma.user.findMany({
    select: {
      role: true,
      referralCode: true,
    }
  });

  const total = allUsers.length;
  const withCode = allUsers.filter(u => u.referralCode !== null).length;
  const missingCode = allUsers.filter(u => u.referralCode === null).length;

  const admins = allUsers.filter(u => ['ADMIN', 'SUPER_ADMIN'].includes(u.role));
  
  console.log(`--- Verification Report ---`);
  console.log(`Total users/members checked: ${total}`);
  console.log(`Number with referralCode: ${withCode}`);
  console.log(`Number missing referralCode: ${missingCode}`);
  
  console.log(`\nAdmin/Super Admin Accounts:`);
  for (const admin of admins) {
    console.log(`Role: ${admin.role} | Has Referral Code: ${admin.referralCode ? 'YES' : 'NO'}`);
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
