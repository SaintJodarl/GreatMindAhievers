export function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateUniqueReferralCode(prisma: any): Promise<string> {
  let code: string;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    code = generateReferralCode();
    const user = await prisma.user.findUnique({ where: { referralCode: code } });
    exists = !!user;
    attempts++;
  }

  if (exists) {
    throw new Error('Unable to generate unique referral code');
  }

  return code!;
}
