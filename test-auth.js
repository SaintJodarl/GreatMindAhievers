const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function run() {
  const email = 'jane@gmail.com';
  const password = 'Abcd1234@1';

  console.log('Finding user...');
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', {
    id: user.id,
    email: user.email,
    status: user.status,
    role: user.role,
    sessionVersion: user.sessionVersion,
    hasPassword: !!user.password
  });

  console.log('Verifying password...');
  try {
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isCorrectPassword);
  } catch (err) {
    console.error('Password comparison failed with error:', err);
  }

  console.log('Executing transaction...');
  try {
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = crypto.randomUUID();
    const newSessionVersion = user.sessionVersion + 1;

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
          userId: user.id,
          tokenHash,
          familyId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 test-script',
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: 'USER_LOGIN',
          targetType: 'User',
          targetId: user.id,
          details: `User logged in successfully: ${user.email}`,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 test-script',
        },
      })
    ]);
    console.log('Transaction succeeded!');
  } catch (err) {
    console.error('Transaction failed with error:', err);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
