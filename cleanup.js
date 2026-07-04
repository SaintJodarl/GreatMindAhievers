const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROTECTED_EMAILS = [
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com'
];

async function cleanup() {
  console.log('Starting Production Handover Cleanup...');

  await prisma.$transaction(async (tx) => {
    // 1. Delete ALL Codes
    console.log('Deleting all AdminCodes...');
    await tx.adminCode.deleteMany({});
    
    console.log('Deleting all ActivationCodes...');
    await tx.activationCode.deleteMany({});

    // 2. Find all non-protected users
    const usersToDelete = await tx.user.findMany({
      where: {
        email: { notIn: PROTECTED_EMAILS }
      },
      select: { id: true, email: true }
    });

    console.log(`Found ${usersToDelete.length} non-protected users to delete.`);

    if (usersToDelete.length > 0) {
      const userIds = usersToDelete.map(u => u.id);

      // Clean up orphaned tree nodes or dependencies explicitly if cascade is somehow failing
      // But Prisma schema has onDelete: Cascade for most things.
      await tx.user.deleteMany({
        where: { id: { in: userIds } }
      });
      console.log('Deleted non-protected users and all cascaded data.');
    }

    // 3. Clear Login Attempts and Activation Attempts to be safe
    console.log('Clearing LoginAttempts & ActivationAttempts...');
    await tx.loginAttempt.deleteMany({});
    await tx.activationAttempt.deleteMany({});
    
    // 4. Any leftover orphaned tickets/messages
    // Ticket user cascade deletes tickets, so no need unless they are fully orphaned
    
  });

  console.log('Cleanup Transaction Completed Successfully.');
}

cleanup()
  .catch(e => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
