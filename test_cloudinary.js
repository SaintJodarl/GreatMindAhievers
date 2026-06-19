const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+)\s*=\s*(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, ''),
  api_key: process.env.CLOUDINARY_API_KEY?.replace(/['"]/g, ''),
  api_secret: process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, ''),
});

async function test() {
  try {
    const res = await cloudinary.api.ping();
    console.log("Ping success:", res);
  } catch (error) {
    console.error("Ping error:", error);
  }
}

test();
