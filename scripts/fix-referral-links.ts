import { PrismaClient } from '@prisma/client';
import { generateReferralLink } from '../src/lib/referral-link';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting referral link correction script...');
  
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');

  if (!isExecute) {
    console.log('\n[DRY RUN MODE] No changes will be saved to the database.');
    console.log('Run with --execute to commit changes.\n');
  } else {
    console.log('\n[EXECUTE MODE] Changes WILL be saved to the database.\n');
  }

  // Fetch all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      referralCode: true,
      referralLink: true,
    }
  });

  console.log(`Found ${users.length} total users in the database.`);
  
  let needsUpdateCount = 0;

  for (const user of users) {
    if (!user.referralCode) {
      continue;
    }

    const correctLink = generateReferralLink(user.referralCode);

    if (user.referralLink !== correctLink) {
      needsUpdateCount++;
      console.log(`\nUser: ${user.email} (Code: ${user.referralCode})`);
      console.log(`  Current Link : ${user.referralLink || 'null'}`);
      console.log(`  Target Link  : ${correctLink}`);

      if (isExecute) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralLink: correctLink }
        });
        console.log(`  -> Updated successfully.`);
      }
    }
  }

  console.log(`\n==============================================`);
  console.log(`Summary:`);
  console.log(`Total users scanned : ${users.length}`);
  console.log(`Users needing update: ${needsUpdateCount}`);
  if (!isExecute) {
    console.log(`Status              : DRY RUN COMPLETED (0 updated)`);
  } else {
    console.log(`Status              : EXECUTE COMPLETED (${needsUpdateCount} updated)`);
  }
  console.log(`==============================================\n`);
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
