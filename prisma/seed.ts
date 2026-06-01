import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gma.network' },
    update: {},
    create: {
      email: 'admin@gma.network',
      name: 'System Admin',
      password: adminPassword,
      role: 'Admin',
      status: 'ACTIVE',
      referralCode: 'GMA-ADMIN',
    },
  });

  // Create some sample admin codes
  const codes = [
    { code: 'NG-REG001', type: 'REGISTRATION', status: 'UNUSED' },
    { code: 'NG-REG002', type: 'REGISTRATION', status: 'UNUSED' },
    { code: 'NG-REG003', type: 'REGISTRATION', status: 'UNUSED' },
    { code: 'NG-KYC001', type: 'KYC', status: 'UNUSED' },
    { code: 'NG-KYC002', type: 'KYC', status: 'UNUSED' },
    { code: 'NG-KYC003', type: 'KYC', status: 'UNUSED' },
  ];

  for (const code of codes) {
    await prisma.adminCode.upsert({
      where: { code: code.code },
      update: {},
      create: code,
    });
  }

  console.log('Seed complete. Admin:', admin.email);
  console.log('Sample codes created:', codes.map(c => c.code).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
