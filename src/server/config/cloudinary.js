import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config();

const uploadsDir = join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mathematics-for-mankind/notes',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif'],
    resource_type: 'auto'
  }
});

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const customStorage = {
  _handleFile(req, file, cb) {
    if (checkCloudinaryKeys()) {
      cloudinaryStorage._handleFile(req, file, (err, info) => {
        if (err) {
          console.warn('Cloudinary upload warning, using local storage:', err.message);
          return localStorage._handleFile(req, file, (lErr, lInfo) => {
            if (lErr) return cb(lErr);
            lInfo.path = `/uploads/${lInfo.filename}`;
            cb(null, lInfo);
          });
        }
        cb(null, info);
      });
    } else {
      localStorage._handleFile(req, file, (err, info) => {
        if (err) return cb(err);
        info.path = `/uploads/${info.filename}`;
        cb(null, info);
      });
    }
  },
  _removeFile(req, file, cb) {
    if (checkCloudinaryKeys()) {
      cloudinaryStorage._removeFile(req, file, cb);
    } else {
      localStorage._removeFile(req, file, cb);
    }
  }
};

const upload = multer({ storage: customStorage });

export default upload;

