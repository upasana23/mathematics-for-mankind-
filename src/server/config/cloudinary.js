import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const hasCloudinaryKeys = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

if (!hasCloudinaryKeys) {
  console.warn('⚠️ WARNING: Cloudinary credentials missing in .env. File uploads will fail.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mathematics-for-mankind/notes',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif'],
    resource_type: 'auto'
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!hasCloudinaryKeys) {
      return cb(new Error('Cloudinary credentials are not configured on the server.'));
    }
    cb(null, true);
  }
});

export default upload;

