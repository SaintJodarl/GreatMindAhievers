import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
}

async function main() {
  // =========================
  // VALIDATE ENV
  // =========================
  const OWNER_ADMIN_PASSWORD = requireEnv("OWNER_ADMIN_PASSWORD");
  const DEV_ADMIN_PASSWORD = requireEnv("DEV_ADMIN_PASSWORD");

  // =========================
  // SUPER ADMIN 1 - OWNER
  // =========================
  const ownerPasswordHash = await bcrypt.hash(OWNER_ADMIN_PASSWORD, 12);

  const ownerAdmin = await prisma.user.upsert({
    where: { email: "makatablessing2026@gmail.com" },
    update: {
      role: Role.SUPER_ADMIN,
      status: "ACTIVE",
    },
    create: {
      email: "makatablessing2026@gmail.com",
      name: "Company Owner",
      password: ownerPasswordHash,
      role: Role.SUPER_ADMIN,
      status: "ACTIVE",
      referralCode: "OWNER-SUPER-001",
      username: "owner_admin",
    },
  });

  // =========================
  // SUPER ADMIN 2 - DEVELOPER
  // =========================
  const devPasswordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 12);

  const devAdmin = await prisma.user.upsert({
    where: { email: "stellarmediang@gmail.com" },
    update: {
      role: Role.SUPER_ADMIN,
      status: "ACTIVE",
    },
    create: {
      email: "stellarmediang@gmail.com",
      name: "System Developer",
      password: devPasswordHash,
      role: Role.SUPER_ADMIN,
      status: "ACTIVE",
      referralCode: "DEV-SUPER-001",
      username: "dev_admin",
    },
  });

  // =========================
  // MEMBER USER (INACTIVE — must activate via activation code, matching production flow)
  // =========================
  const memberPassword = await bcrypt.hash("Member@2026", 10);

  const member = await prisma.user.upsert({
    where: { email: "adebayo.okafor@gma.network" },
    update: {
      role: Role.MEMBER,
      status: "INACTIVE",
    },
    create: {
      email: "adebayo.okafor@gma.network",
      name: "Adebayo Okafor",
      password: memberPassword,
      role: Role.MEMBER,
      status: "INACTIVE",
      referralCode: "GMA-MBR1",
      username: "adebayo_okafor",
    },
  });

  console.log("✅ Owner Admin:", ownerAdmin.email);
  console.log("✅ Dev Admin:", devAdmin.email);
  console.log("✅ Member:", member.email);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });