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

async function createPreset() {
  try {
    const result = await cloudinary.api.create_upload_preset({
      name: "mlm_unsigned",
      unsigned: true,
      folder: "mlm/users",
    });
    console.log("Preset created:", result);
  } catch (err) {
    console.error("Error creating preset:", err);
  }
}

createPreset();
