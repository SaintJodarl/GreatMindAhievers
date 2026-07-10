import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getRequiredSeedPassword(envName: string): string {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`Missing required ${envName} environment variable for super admin seeding.`);
  }
  return value;
}

async function main() {
  // =========================
  // SECURE PASSWORDS FOR SEEDING
  // =========================
  const OWNER_ADMIN_PASSWORD = getRequiredSeedPassword('OWNER_ADMIN_PASSWORD');
  const GMA_ADMIN_PASSWORD = getRequiredSeedPassword('GMA_ADMIN_PASSWORD');
  const DEV_ADMIN_PASSWORD = getRequiredSeedPassword('DEV_ADMIN_PASSWORD');

  // =========================
  // SUPER ADMIN 1 - Blessing Makata (Owner)
  // =========================
  const ownerPasswordHash = await bcrypt.hash(OWNER_ADMIN_PASSWORD, 12);
  const ownerAdmin = await prisma.user.upsert({
    where: { email: 'makatablessing2026@gmail.com' },
    update: {
      name: 'Blessing Makata',
      password: ownerPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      adminRole: 'SUPER_ADMIN',
      referralCode: null,
      referralLink: null,
      sponsorId: null,
      placementId: null,
      binaryPosition: null,
    },
    create: {
      email: 'makatablessing2026@gmail.com',
      name: 'Blessing Makata',
      password: ownerPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      username: 'blessing_makata',
      adminRole: 'SUPER_ADMIN',
    },
  });

  // =========================
  // SUPER ADMIN 2 - Great-Mind Achievers
  // =========================
  const gmaPasswordHash = await bcrypt.hash(GMA_ADMIN_PASSWORD, 12);
  const gmaAdmin = await prisma.user.upsert({
    where: { email: 'gmanetworkng@gmail.com' },
    update: {
      name: 'Great-Mind Achievers',
      password: gmaPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      adminRole: 'SUPER_ADMIN',
      referralCode: null,
      referralLink: null,
      sponsorId: null,
      placementId: null,
      binaryPosition: null,
    },
    create: {
      email: 'gmanetworkng@gmail.com',
      name: 'Great-Mind Achievers',
      password: gmaPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      username: 'gma_network',
      adminRole: 'SUPER_ADMIN',
    },
  });

  // =========================
  // SUPER ADMIN 3 - Stellar Media (Developer)
  // =========================
  const devPasswordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 12);
  const devAdmin = await prisma.user.upsert({
    where: { email: 'stellarmediang@gmail.com' },
    update: {
      name: 'Stellar Media',
      password: devPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      adminRole: 'SUPER_ADMIN',
      referralCode: null,
      referralLink: null,
      sponsorId: null,
      placementId: null,
      binaryPosition: null,
    },
    create: {
      email: 'stellarmediang@gmail.com',
      name: 'Stellar Media',
      password: devPasswordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      username: 'stellar_media',
      adminRole: 'SUPER_ADMIN',
    },
  });

  // =========================
  // DEFAULT ADMIN ROLES
  // =========================
  const adminRoles = [
    {
      name: 'SUPER_ADMIN',
      description: 'Full system access',
      permissions: JSON.stringify(['*']),
    },
    {
      name: 'FINANCE_ADMIN',
      description: 'Wallet, withdrawals, commissions access',
      permissions: JSON.stringify([
        'wallet:read',
        'wallet:write',
        'withdrawal:read',
        'withdrawal:write',
        'commission:read',
        'commission:write',
        'audit:read',
      ]),
    },
    {
      name: 'SUPPORT_ADMIN',
      description: 'Support tickets and KYC access',
      permissions: JSON.stringify([
        'support:read',
        'support:write',
        'kyc:read',
        'kyc:write',
        'member:read',
      ]),
    },
    {
      name: 'READ_ONLY_ADMIN',
      description: 'View-only access to all modules',
      permissions: JSON.stringify([
        'member:read',
        'wallet:read',
        'withdrawal:read',
        'commission:read',
        'kyc:read',
        'support:read',
        'audit:read',
        'reports:read',
      ]),
    },
  ];

  for (const role of adminRoles) {
    await prisma.adminRole.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        permissions: role.permissions,
      },
      create: role,
    });
  }

  // =========================
  // COMMISSION SETTINGS
  // =========================
  const commissions = [
    { type: 'DIRECT', percentage: 10, fixedAmount: null },
    { type: 'PAIRING', percentage: 5, fixedAmount: null },
    { type: 'LEADERSHIP', percentage: null, fixedAmount: 500 },
  ];

  for (const comm of commissions) {
    const existing = await prisma.commissionSetting.findFirst({
      where: { type: comm.type },
    });
    if (!existing) {
      await prisma.commissionSetting.create({
        data: {
          type: comm.type,
          percentage: comm.percentage,
          fixedAmount: comm.fixedAmount,
          isActive: true,
        },
      });
    }
  }

  console.log('✅ Seed complete.');
  console.log('  - Super Admin 1 (Owner):', ownerAdmin.email);
  console.log('  - Super Admin 2 (GMA):  ', gmaAdmin.email);
  console.log('  - Super Admin 3 (Dev):  ', devAdmin.email);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
