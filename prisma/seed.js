const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gma.network' },
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      email: 'admin@gma.network',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      referralCode: 'GMA-ADMIN',
      adminRole: 'SUPER_ADMIN',
    },
  });

  // Ensure wallets exist
  const adminWallet = await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { id: admin.id, userId: admin.id, balance: 100000 },
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

  // Create basic commission settings
  const commissions = [
    { type: 'DIRECT', percentage: 10 },
    { type: 'PAIRING', percentage: 5 },
    { type: 'LEADERSHIP', fixedAmount: 500 },
  ];

  for (const comm of commissions) {
    await prisma.commission.create({
      data: comm,
    });
  }

  // Create default admin roles
  const adminRoles = [
    {
      name: 'SUPER_ADMIN',
      description: 'Full system access',
      permissions: JSON.stringify(['*']),
    },
    {
      name: 'FINANCE_ADMIN',
      description: 'Wallet, withdrawals, commissions access',
      permissions: JSON.stringify(['wallet:read', 'wallet:write', 'withdrawal:read', 'withdrawal:write', 'commission:read', 'commission:write', 'audit:read']),
    },
    {
      name: 'SUPPORT_ADMIN',
      description: 'Support tickets and KYC access',
      permissions: JSON.stringify(['support:read', 'support:write', 'kyc:read', 'kyc:write', 'member:read']),
    },
    {
      name: 'READ_ONLY_ADMIN',
      description: 'View-only access to all modules',
      permissions: JSON.stringify(['member:read', 'wallet:read', 'withdrawal:read', 'commission:read', 'kyc:read', 'support:read', 'audit:read', 'reports:read']),
    },
  ];

  for (const role of adminRoles) {
    await prisma.adminRole.upsert({
      where: { name: role.name },
      update: {},
      create: role,
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
