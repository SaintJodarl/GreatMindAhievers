import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all users...');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      sponsorId: true,
    },
  });

  console.log(`Found ${users.length} users. Calculating paths and depths...`);

  // Build a map for easy lookup
  const userMap = new Map<string, { id: string; sponsorId: string | null }>();
  for (const user of users) {
    userMap.set(user.id, user);
  }

  // Helper to compute path and depth for a user
  const computed = new Map<string, { path: string; depth: number }>();

  function resolveUser(userId: string, visited = new Set<string>()): { path: string; depth: number } {
    if (computed.has(userId)) {
      return computed.get(userId)!;
    }

    if (visited.has(userId)) {
      // Circular dependency detected! Set as a root node to break loop.
      console.warn(`Circular dependency detected for user ${userId}. Setting as root.`);
      const result = { path: `root/${userId}`, depth: 0 };
      computed.set(userId, result);
      return result;
    }

    visited.add(userId);
    const user = userMap.get(userId);

    if (!user || !user.sponsorId) {
      const result = { path: `root/${userId}`, depth: 0 };
      computed.set(userId, result);
      return result;
    }

    // Resolve sponsor
    const sponsorResult = resolveUser(user.sponsorId, visited);
    const result = {
      path: `${sponsorResult.path}/${userId}`,
      depth: sponsorResult.depth + 1,
    };
    computed.set(userId, result);
    return result;
  }

  // Compute for all users
  for (const user of users) {
    resolveUser(user.id);
  }

  console.log('Updating user records in database...');
  let updatedCount = 0;

  // Update in a transaction
  await prisma.$transaction(
    users.map((user) => {
      const data = computed.get(user.id)!;
      updatedCount++;
      return prisma.user.update({
        where: { id: user.id },
        data: {
          path: data.path,
          depth: data.depth,
        },
      });
    })
  );

  console.log(`Successfully updated ${updatedCount} users with materialized path and depth.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
