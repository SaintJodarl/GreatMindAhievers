import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // =========================
  // SECURE PASSWORDS FOR SEEDING
  // =========================
  const OWNER_ADMIN_PASSWORD = process.env.OWNER_ADMIN_PASSWORD || "madamBlessing@1";
  const GMA_ADMIN_PASSWORD = process.env.GMA_ADMIN_PASSWORD || "gma.Network@1";
  const DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || "gma.Network@2";

  // =========================
  // SUPER ADMIN 1 - Blessing Makata (Owner)
  // =========================
  const ownerPasswordHash = await bcrypt.hash(OWNER_ADMIN_PASSWORD, 12);
  const ownerAdmin = await prisma.user.upsert({
    where: { email: "makatablessing2026@gmail.com" },
    update: {
      name: "Blessing Makata",
      password: ownerPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      adminRole: "SUPER_ADMIN",
    },
    create: {
      email: "makatablessing2026@gmail.com",
      name: "Blessing Makata",
      password: ownerPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      referralCode: "OWNER-SUPER-001",
      username: "blessing_makata",
      adminRole: "SUPER_ADMIN",
    },
  });

  // =========================
  // SUPER ADMIN 2 - Great-Mind Achievers
  // =========================
  const gmaPasswordHash = await bcrypt.hash(GMA_ADMIN_PASSWORD, 12);
  const gmaAdmin = await prisma.user.upsert({
    where: { email: "gmanetworkng@gmail.com" },
    update: {
      name: "Great-Mind Achievers",
      password: gmaPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      adminRole: "SUPER_ADMIN",
    },
    create: {
      email: "gmanetworkng@gmail.com",
      name: "Great-Mind Achievers",
      password: gmaPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      referralCode: "GMA-SUPER-001",
      username: "gma_network",
      adminRole: "SUPER_ADMIN",
    },
  });

  // =========================
  // SUPER ADMIN 3 - Stellar Media (Developer)
  // =========================
  const devPasswordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 12);
  const devAdmin = await prisma.user.upsert({
    where: { email: "stellarmediang@gmail.com" },
    update: {
      name: "Stellar Media",
      password: devPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      adminRole: "SUPER_ADMIN",
    },
    create: {
      email: "stellarmediang@gmail.com",
      name: "Stellar Media",
      password: devPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      referralCode: "DEV-SUPER-001",
      username: "stellar_media",
      adminRole: "SUPER_ADMIN",
    },
  });

  // =========================
  // ENSURE WALLETS EXIST
  // =========================
  const usersWithWallets = [ownerAdmin, gmaAdmin, devAdmin];
  const walletBalances: Record<string, number> = {
    [ownerAdmin.id]: 100000,
    [gmaAdmin.id]: 100000,
    [devAdmin.id]: 100000,
  };

  for (const u of usersWithWallets) {
    await prisma.wallet.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        id: u.id,
        userId: u.id,
        balance: walletBalances[u.id] || 0,
      },
    });
  }

  // =========================
  // DEFAULT ADMIN ROLES
  // =========================
  const adminRoles = [
    {
      name: "SUPER_ADMIN",
      description: "Full system access",
      permissions: JSON.stringify(["*"]),
    },
    {
      name: "FINANCE_ADMIN",
      description: "Wallet, withdrawals, commissions access",
      permissions: JSON.stringify([
        "wallet:read",
        "wallet:write",
        "withdrawal:read",
        "withdrawal:write",
        "commission:read",
        "commission:write",
        "audit:read",
      ]),
    },
    {
      name: "SUPPORT_ADMIN",
      description: "Support tickets and KYC access",
      permissions: JSON.stringify([
        "support:read",
        "support:write",
        "kyc:read",
        "kyc:write",
        "member:read",
      ]),
    },
    {
      name: "READ_ONLY_ADMIN",
      description: "View-only access to all modules",
      permissions: JSON.stringify([
        "member:read",
        "wallet:read",
        "withdrawal:read",
        "commission:read",
        "kyc:read",
        "support:read",
        "audit:read",
        "reports:read",
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
    { type: "DIRECT", percentage: 10, fixedAmount: null },
    { type: "PAIRING", percentage: 5, fixedAmount: null },
    { type: "LEADERSHIP", percentage: null, fixedAmount: 500 },
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

  // =========================
  // SAMPLE ADMIN CODES
  // =========================
  const codes = [
    { code: "NG-REG001", type: "REGISTRATION", status: "UNUSED" },
    { code: "NG-REG002", type: "REGISTRATION", status: "UNUSED" },
    { code: "NG-REG003", type: "REGISTRATION", status: "UNUSED" },
    { code: "NG-KYC001", type: "KYC", status: "UNUSED" },
    { code: "NG-KYC002", type: "KYC", status: "UNUSED" },
    { code: "NG-KYC003", type: "KYC", status: "UNUSED" },
  ];

  for (const code of codes) {
    await prisma.adminCode.upsert({
      where: { code: code.code },
      update: {},
      create: code,
    });
  }

  console.log("✅ Seed complete.");
  console.log("  - Super Admin 1 (Owner):", ownerAdmin.email);
  console.log("  - Super Admin 2 (GMA):  ", gmaAdmin.email);
  console.log("  - Super Admin 3 (Dev):  ", devAdmin.email);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
