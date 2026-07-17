import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

const checkCloudinaryKeys = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (checkCloudinaryKeys()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Use memory storage — we'll upload buffer to Cloudinary manually
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Helper: upload a buffer to Cloudinary and return the secure URL
export const uploadToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    if (!checkCloudinaryKeys()) {
      return reject(new Error('Cloudinary credentials are not configured on the server.'));
    }
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'mathematics-for-mankind/notes',
        resource_type: 'auto',
        public_id: `${Date.now()}-${originalname.replace(/[^a-z0-9]/gi, '_')}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export default upload;
