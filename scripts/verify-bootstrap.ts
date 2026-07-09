import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting verification...");

  // 1. Verify OWNER-SUPER-001 exists as an ActivationCode and is UNUSED/USED
  const activationCode = await prisma.activationCode.findUnique({
    where: { code: "OWNER-SUPER-001" },
  });

  if (!activationCode) {
    console.error("❌ Verification failed: OWNER-SUPER-001 does not exist in ActivationCode table.");
    process.exit(1);
  }
  
  if (
    activationCode.status !== "UNUSED" ||
    activationCode.redeemedBy !== null ||
    activationCode.redeemedDate !== null ||
    activationCode.expirationDate !== null
  ) {
    console.error("❌ Verification failed: OWNER-SUPER-001 has incorrect status or redemption fields.");
    console.error(activationCode);
    process.exit(1);
  }
  
  console.log(`✅ OWNER-SUPER-001 ActivationCode exists. Status: ${activationCode.status}`);
  console.log(`✅ OWNER-SUPER-001 is reusable (redeemedBy, redeemedDate, expirationDate are all null).`);

  // 2. Verify owner/root member has a referralCode
  const ownerUser = await prisma.user.findUnique({
    where: { referralCode: "OWNER-SUPER-001" },
  });

  if (!ownerUser) {
    console.error("❌ Verification failed: Owner user with referralCode OWNER-SUPER-001 does not exist.");
    process.exit(1);
  }
  
  console.log(`✅ Owner User exists with ID: ${ownerUser.id} and referralCode: ${ownerUser.referralCode}`);

  // 3. Verify owner/root member can have a BinaryTree record without parent (or it can be created)
  const binaryTree = await prisma.binaryTree.findUnique({
    where: { userId: ownerUser.id },
  });

  if (binaryTree) {
    console.log(`✅ BinaryTree record for Owner exists. ParentId is ${binaryTree.parentId === null ? 'null (Root)' : binaryTree.parentId}`);
  } else {
    console.log("ℹ️ BinaryTree record for Owner does not exist yet. This is expected before first downline registration or until explicitly created.");
  }
  
  console.log("✅ Verification successful.");
}

main()
  .catch((e) => {
    console.error("❌ Verification failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
