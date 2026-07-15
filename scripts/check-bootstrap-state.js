const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkState() {
  const rootParent = await prisma.user.findUnique({
    where: { referralCode: 'ROOT-PARENT-001' }
  });
  console.log('ROOT-PARENT-001 User:', rootParent ? rootParent.email : 'None (Magic String Bypass Expected)');

  const ownerSuper = await prisma.user.findUnique({
    where: { referralCode: 'OWNER-SUPER-001' }
  });
  console.log('OWNER-SUPER-001 User:', ownerSuper ? ownerSuper.email : 'None');

  const activationCode = await prisma.activationCode.findUnique({
    where: { code: 'GMA-000001' }
  });
  console.log('GMA-000001 Code Details:');
  console.log(activationCode || 'Not found');
}

checkState()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
