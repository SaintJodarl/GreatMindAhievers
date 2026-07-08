import { prisma } from '@/lib/prisma';

export async function processReferralUpdate(event: any) {
  const { userId, sponsorId } = event.payload;

  // IMMUTABILITY RULE: ancestorPath is generated ONCE
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.path) {
    console.log(`[Referral Worker] User ${userId} already has an ancestor path. Skipping.`);
    return;
  }

  const sponsor = await prisma.user.findUnique({ where: { id: sponsorId } });
  if (!sponsor) return;

  // Prevent circular references
  if (sponsor.path && sponsor.path.includes(`.${userId}.`)) {
    throw new Error(`Circular referral detected for User ${userId}`);
  }

  const newPath = sponsor.path ? `${sponsor.path}${userId}.` : `.${sponsorId}.${userId}.`;
  const newDepth = sponsor.depth + 1;

  // Write new path to user
  await prisma.user.update({
    where: { id: userId },
    data: {
      path: newPath,
      depth: newDepth,
    },
  });
}
