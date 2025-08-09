import express, { type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import authenticate from '../middleware/authMiddleware';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const router = express.Router();

/* --------------------------- CREATE (manual metadata) --------------------------- */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  const {
    title,
    type,
    fileUrl, // required by schema
    content,
    name,
    court,
    motionType,
    caseNumber,
    claimants,
    respondents
  } = req.body;

  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
  if (!fileUrl || !title || !type) { res.status(400).json({ message: 'Missing required fields' }); return; }

  try {
    const newDoc = await prisma.document.create({
      data: {
        userId, title, type, fileUrl, content, name, court,
        motionType, caseNumber, claimants, respondents
      }
    });
    res.status(201).json(newDoc);
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* --------------------------- LIST (by user) --------------------------- */
router.get('/user/:userId', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const authUserId = req.user?.id;

  if (!authUserId || authUserId !== userId) { res.status(403).json({ message: 'Forbidden' }); return; }

  try {
    const documents = await prisma.document.findMany({
      where: { userId },
      include: { aiGeneratedDocument: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(documents);
  } catch (err) {
    console.error('Error fetching user documents:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

/* --------------------------- Multer (disk) --------------------------- */
const uploadDir = path.resolve(process.cwd(), 'uploads');
// absolute path used everywhere
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.-]+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({ storage });

/* --------------------------- UPLOAD (multipart) --------------------------- */
// Route mount assumed at /api/documents -> this becomes POST /api/documents/upload
router.post('/upload',
  authenticate,               // auth first so we don't save anonymous files
  upload.single('file'),      // frontend must use field name "file"
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!req.file || !userId) { res.status(400).json({ message: 'Missing file or user ID' }); return; }

    try {
      let parsedText = '';
      if (req.file.mimetype === 'application/pdf') {
        const fileBuffer = fs.readFileSync(req.file.path);
        const parsed = await pdfParse(fileBuffer);
        parsedText = parsed.text || '';
      }

      const newDoc = await prisma.document.create({
        data: {
          userId,
          title: req.file.originalname,
          type: 'uploaded',
          fileUrl: `/uploads/${req.file.filename}`, // served statically by app.ts
          content: parsedText,
          source: 'user',
          status: 'uploaded'
        }
      });

      res.status(201).json({ message: 'Upload successful', document: newDoc });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

/* --------------------------- UPDATE --------------------------- */
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

  try {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) { res.status(403).json({ message: 'Forbidden' }); return; }

    const updated = await prisma.document.update({ where: { id }, data: req.body });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* --------------------------- GET by ID --------------------------- */
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { aiGeneratedDocument: true },
    });

    if (!doc) { res.status(404).json({ message: 'Document not found' }); return; }
    if (doc.userId !== userId) { res.status(403).json({ message: 'Unauthorized access' }); return; }

    res.status(200).json(doc);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ message: 'Error retrieving document', error: err });
  }
});

/* --------------------------- DELETE (regular or AI) --------------------------- */
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const type = (req.query.type as string) || 'regular';
  const userId = req.user?.id;

  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

  try {
    if (type === 'ai') {
      const aiDoc = await prisma.aiGeneratedDocument.findUnique({ where: { id } });
      if (!aiDoc || aiDoc.userId !== userId) { res.status(403).json({ message: 'Unauthorized or not found' }); return; }
      await prisma.aiGeneratedDocument.delete({ where: { id } });
      res.status(200).json({ message: 'AI document deleted' });
      return;
    }

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) { res.status(403).json({ message: 'Forbidden' }); return; }
    await prisma.document.delete({ where: { id } });
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ message: 'Failed to delete document', error: err });
  }
});

export default router;
