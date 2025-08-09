// src/utils/multer.ts
import multer from 'multer';
import path from 'path';
import { uploadDir } from './uploads';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.-]+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

export const upload = multer({ storage });
