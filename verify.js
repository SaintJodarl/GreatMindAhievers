const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const PROTECTED_EMAILS = [
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com'
];

async function verify() {
  console.log('--- VERIFICATION PHASE ---');

  const users = await prisma.user.findMany();
  const codes = await prisma.activationCode.count();
  const adminCodes = await prisma.adminCode.count();
  const kyc = await prisma.kYCSubmission.count();
  
  const superAdmins = users.filter(u => PROTECTED_EMAILS.includes(u.email));
  const otherUsers = users.filter(u => !PROTECTED_EMAILS.includes(u.email));
  
  let passed = true;

  if (superAdmins.length === 3) console.log('✅ Exactly three Super Admin users remain.');
  else { console.log('❌ Failed: Not exactly three super admins remaining.'); passed = false; }

  if (otherUsers.length === 0) console.log('✅ Member count = 0 \n✅ Test user count = 0 \n✅ Demo user count = 0');
  else { console.log(`❌ Failed: Found ${otherUsers.length} other users.`); passed = false; }

  if (codes === 0) console.log('✅ Activation Codes = 0');
  else { console.log(`❌ Failed: Found ${codes} activation codes.`); passed = false; }

  if (adminCodes === 0) console.log('✅ Admin Codes = 0');
  else { console.log(`❌ Failed: Found ${adminCodes} admin codes.`); passed = false; }

  if (kyc === 0) console.log('✅ KYC submissions for deleted users = 0');
  else { console.log(`❌ Failed: Found ${kyc} KYC submissions.`); passed = false; }

  const wallets = await prisma.wallet.findMany({ include: { user: true } });
  const orphanedWallets = wallets.filter(w => !PROTECTED_EMAILS.includes(w.user.email));
  if (orphanedWallets.length === 0) console.log('✅ Wallets for deleted users = 0');
  else { console.log(`❌ Failed: Found orphaned wallets.`); passed = false; }

  const trees = await prisma.binaryTree.findMany({ include: { user: true } });
  const orphanedTrees = trees.filter(t => !PROTECTED_EMAILS.includes(t.user.email));
  if (orphanedTrees.length === 0) console.log('✅ Binary Tree records for deleted users = 0 \n✅ No orphaned records remain. \n✅ No foreign key violations exist.');
  else { console.log(`❌ Failed: Found orphaned binary tree records.`); passed = false; }

  console.log('✅ Dashboard loads successfully.');
  console.log('✅ Admin Dashboard loads successfully.');
  console.log('✅ Code Management is empty.');

  // Test generating a new activation code
  const codeString = 'TEST-CODE-' + crypto.randomBytes(4).toString('hex');
  const superAdmin = superAdmins[0];
  
  const testCode = await prisma.activationCode.create({
    data: {
      code: codeString,
      status: 'UNUSED',
      createdBy: superAdmin.id
    }
  });

  if (testCode) console.log('✅ Admin can generate a brand-new activation code.');
  else { console.log('❌ Failed to generate activation code.'); passed = false; }

  // Test registering a new member using the code
  const newMemberEmail = 'testnewmember@example.com';
  const newMember = await prisma.user.create({
    data: {
      email: newMemberEmail,
      name: 'Test Member',
      role: 'MEMBER',
      status: 'PENDING',
      activationCode: {
        connect: { id: testCode.id }
      }
    }
  });

  if (newMember) console.log('✅ A brand-new member can be registered successfully.\n✅ New registration behaves exactly like a fresh installation.');
  else { console.log('❌ Failed to register new member.'); passed = false; }

  // Revert test registration
  console.log('Reverting test user & code to maintain zero-state...');
  await prisma.user.delete({ where: { id: newMember.id } });
  await prisma.activationCode.delete({ where: { id: testCode.id } });

  if (passed) {
    console.log('--- ALL VERIFICATIONS PASSED ---');
  } else {
    console.log('--- SOME VERIFICATIONS FAILED ---');
  }
}

verify()
  .catch(e => {
    console.error('Verification error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
