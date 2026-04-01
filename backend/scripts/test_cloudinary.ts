import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function testCloudinary() {
  console.log('🔄 Testing Cloudinary connection...');
  console.log(`☁️ Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`🔑 API Key: ${process.env.CLOUDINARY_API_KEY}`);

  try {
    const result = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
      folder: 'test-connection',
      public_id: 'test-image'
    });

    console.log('✅ Cloudinary Connection Successful!');
    console.log('🖼️ Test Image URL:', result.secure_url);
  } catch (error: any) {
    console.error('❌ Cloudinary Connection Failed!');
    console.error('Error Details:', error.message || error);
    if ((error.message || '').includes('Unknown API key')) {
      console.log('💡 TIP: Double-check that your API Key is correct and that your Cloud Name is correctly spelled.');
    }
  }
}

testCloudinary();
