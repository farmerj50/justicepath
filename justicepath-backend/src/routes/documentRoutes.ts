import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import authenticate from '../middleware/authMiddleware';
import { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs';


const router = express.Router();


router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  // ✅ Include fileUrl here
  const {
    title,
    type,
    fileUrl, // ✅ Required field from Prisma schema
    content,
    name,
    court,
    motionType,
    caseNumber,
    claimants,
    respondents
  } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!fileUrl || !title || !type) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }

  try {
    const newDoc = await prisma.document.create({
      data: {
        userId,
        title,
        type,
        fileUrl, // ✅ Must be included
        content,
        name,
        court,
        motionType,
        caseNumber,
        claimants,
        respondents
      }
    });

    res.status(201).json(newDoc);
    return;
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
});



// GET /user/:userId → get all documents for a user
router.get('/user/:userId', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const authUserId = req.user?.id;

  // Only allow the authenticated user to access their own documents
  if (!authUserId || authUserId !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  try {
    const documents = await prisma.document.findMany({
  where: { userId },
  include: {
    aiGeneratedDocument: true, // ✅ join the AI data
  },
  orderBy: {
    createdAt: 'desc', // Optional: sort by most recent
  },
});


    res.status(200).json(documents);
  } catch (err) {
    console.error('Error fetching user documents:', err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// POST /api/documents/upload
router.post('/upload', upload.single('file'), authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!req.file || !userId) {
    res.status(400).json({ message: 'Missing file or user ID' });
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(fileBuffer);

    const newDoc = await prisma.document.create({
      data: {
        userId,
        title: req.file.originalname,
        type: 'uploaded',
        fileUrl: `/uploads/${req.file.filename}`,
        content: parsed.text, // ✅ Save the PDF content!
        source: 'user',
        status: 'uploaded'
      }
    });

    res.status(201).json({ message: 'Upload successful', document: newDoc });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err });
  }
});
// GET /api/ai/ai-documents/:userId → returns AI documents only

router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc || doc.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updated = await prisma.document.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json(updated);
    return;
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
});
// GET /api/documents/:id → Fetch a single document by ID
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        aiGeneratedDocument: true, // Optional join
      },
    });

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Ensure document belongs to the current user
    if (doc.userId !== userId) {
      res.status(403).json({ message: 'Unauthorized access' });
      return;
    }

    res.status(200).json(doc);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ message: 'Error retrieving document', error: err });
  }
});




export default router;