const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectMore() {
  const binaryTrees = await prisma.binaryTree.findMany({
    include: { user: true }
  });
  console.log('BinaryTrees:');
  binaryTrees.forEach(b => console.log(` - ${b.user.email} (depth: ${b.depth})`));

  const wallets = await prisma.wallet.findMany({
    include: { user: true }
  });
  console.log('Wallets:');
  wallets.forEach(w => console.log(` - ${w.user.email} (${w.balance})`));
}

inspectMore().catch(console.error).finally(() => prisma.$disconnect());
