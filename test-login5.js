const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
async function run() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'jane@gmail.com' } });
    console.log('User found:', user.email);
    const newSessionVersion = (user.sessionVersion || 1) + 1;
    
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = crypto.randomUUID();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { sessionVersion: newSessionVersion }
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id }
      }),
      prisma.refreshToken.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          tokenHash,
          familyId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: null,
          userAgent: null,
        }
      }),
      prisma.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          adminId: user.id,
          action: 'LOGIN',
          targetType: 'User',
          targetId: user.id,
          details: 'User logged in',
        }
      })
    ]);
    console.log('Update successful');
  } catch(e) {
    console.error('Update failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
