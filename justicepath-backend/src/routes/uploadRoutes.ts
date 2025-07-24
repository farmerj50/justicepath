import { Router, Request, Response } from 'express';
import multer, { Multer } from 'multer'; // optional, helps with autocomplete
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = Router();

// Setup multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// 👇 Fix here
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const { userId, title = 'Uploaded Document' } = req.body;
  const file = (req as Request & { file: Express.Multer.File }).file;

  if (!file || !userId) {
    res.status(400).json({ error: 'Missing file or userId' });
    return;
  }

  try {
    const document = await prisma.document.create({
      data: {
        userId,
        title,
        fileUrl: `/uploads/${file.filename}`,
        type: 'upload',
        status: 'uploaded',
        source: 'user',
      },
    });

    res.status(200).json(document);
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
