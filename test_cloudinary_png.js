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
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const uploadPromise = new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'mlm/users/test/kyc',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
  
  try {
    const result = await uploadPromise;
    console.log("Upload success:", result.secure_url);
  } catch (err) {
    console.error("Upload error:", err);
  }
}

testUpload();
