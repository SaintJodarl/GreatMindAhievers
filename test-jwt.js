const { SignJWT } = require('jose');

// Read from .env file since process.env is not populated automatically in node scripts
const fs = require('fs');
const path = require('path');

let JWT_SECRET_STRING = 'gma-dev-secret-key-change-in-production-123456789';
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/JWT_SECRET="?([^"\n\r]+)"?/);
  if (match) {
    JWT_SECRET_STRING = match[1];
  }
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

async function run() {
  const payload = {
    sub: 'cmqobtwqy000eybor244m1yhg',
    role: 'MEMBER',
    status: 'ACTIVE',
    onboardingStatus: 'INCOMPLETE',
    sessionVersion: 5,
  };
  console.log('Using JWT_SECRET_STRING:', JWT_SECRET_STRING);
  console.log('Key length in bytes:', JWT_SECRET.length);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
  console.log('JWT Token signed successfully:', token);
}

run().catch(console.error);
