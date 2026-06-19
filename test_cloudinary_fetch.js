const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+)\s*=\s*(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
});

const crypto = require('crypto');

async function testFetchUpload() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET.trim();
  
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'mlm/users/test/kyc';
  
  // signature = sha1(folder=test&timestamp=1234567890 + api_secret)
  const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(strToSign).digest('hex');
  
  const formData = new FormData();
  formData.append('file', new Blob([Buffer.from('hello world')]), 'test.txt');
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  console.log("Uploading to:", url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testFetchUpload();
