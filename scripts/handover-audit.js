const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  console.log('--- DATABASE AUDIT START ---');
  
  // A. Super Admins
  const superAdmins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { email: true, role: true, status: true, referralCode: true, placementId: true }
  });
  console.log('SUPER_ADMINS:', JSON.stringify(superAdmins, null, 2));

  // B. Normal member count
  const normalMembers = await prisma.user.findMany({
    where: { role: 'MEMBER' },
    select: { name: true, email: true, status: true, referralCode: true, createdAt: true }
  });
  console.log('NORMAL_MEMBERS_COUNT:', normalMembers.length);
  console.log('NORMAL_MEMBERS:', JSON.stringify(normalMembers, null, 2));

  // C. Adebayo cleanup
  const adebayoUser = await prisma.user.findFirst({
    where: { OR: [{ email: 'adebayo.okafor@gma.network' }, { referralCode: 'GMA-MBR1' }] }
  });
  console.log('ADEBAYO_USER:', adebayoUser ? 'EXISTS' : 'NOT FOUND');

  // D. Root parent setup
  const rootParent = await prisma.user.findUnique({
    where: { referralCode: 'ROOT-PARENT-001' }
  });
  console.log('ROOT_PARENT_CODE_OWNER:', rootParent ? 'EXISTS' : 'NOT FOUND');

  // E. Activation code setup
  const gma000001 = await prisma.activationCode.findUnique({
    where: { code: 'GMA-000001' }
  });
  console.log('GMA_000001:', JSON.stringify(gma000001, null, 2));

  // F. OWNER-SUPER-001
  const ownerSuperCode = await prisma.activationCode.findUnique({
    where: { code: 'OWNER-SUPER-001' }
  });
  console.log('OWNER_SUPER_001_ACTIVATION_CODE:', ownerSuperCode ? 'EXISTS' : 'NOT FOUND');

  console.log('--- DATABASE AUDIT END ---');
}

runAudit().catch(console.error).finally(() => prisma.$disconnect());
