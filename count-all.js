const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countAll() {
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof prisma[k].count === 'function');
  const counts = {};
  for (const model of models) {
    counts[model] = await prisma[model].count();
  }
  console.log('Table Counts:');
  for (const [model, count] of Object.entries(counts)) {
    console.log(`${model}: ${count}`);
  }
}

countAll().catch(console.error).finally(() => prisma.$disconnect());
