const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+)\s*=\s*(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '').trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.replace(/['"]/g, '').trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, '').trim(),
});

async function testUpload() {
  // A tiny valid 1x1 PNG buffer
  const base64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAGBAQABAAAAAQ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAAPwBB/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAhAAPwBB/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAxAAPwBB/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPwBB/9k=';
  
  try {
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64}`,
      {
        upload_preset: 'mlm_uploads',
        folder: `mlm/uploads/test-user/kyc`,
        resource_type: 'auto',
        async: false
      }
    );
    console.log("Unsigned upload success:", uploadResult);
  } catch (err) {
    console.error("Unsigned upload error:", JSON.stringify(err, null, 2));
  }
}

testUpload();
