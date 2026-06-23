const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'jane@gmail.com' } });
    console.log('User found:', user.email);
    const newSessionVersion = (user.sessionVersion || 1) + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionVersion: newSessionVersion }
    });
    console.log('Update successful');
  } catch(e) {
    console.error('Update failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
