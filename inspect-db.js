const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  const adminCodes = await prisma.adminCode.count();
  const activationCodes = await prisma.activationCode.count();
  const wallets = await prisma.wallet.count();
  const kyc = await prisma.kYCSubmission.count();
  const binaryTrees = await prisma.binaryTree.count();

  console.log(`Total users: ${users.length}`);
  console.log('Users:');
  users.forEach(u => console.log(` - ${u.email} (${u.role})`));
  console.log(`AdminCodes: ${adminCodes}`);
  console.log(`ActivationCodes: ${activationCodes}`);
  console.log(`Wallets: ${wallets}`);
  console.log(`KYC Submissions: ${kyc}`);
  console.log(`BinaryTrees: ${binaryTrees}`);
}

inspect().catch(console.error).finally(() => prisma.$disconnect());
