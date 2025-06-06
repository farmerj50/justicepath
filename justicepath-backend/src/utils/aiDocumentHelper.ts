// FIX: Ensure you regenerate Prisma Client
// Run this in the backend folder:
//    npx prisma generate

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const saveAiGeneratedDocument = async ({
  userId,
  documentType,
  content,
  followUps = [],
  aiSuggestion = '',
  source = 'form',
  status = 'draft'
}: {
  userId: string;
  documentType: string;
  content: string;
  followUps?: Array<{ question: string; answer: string }>;
  aiSuggestion?: string;
  source?: string;
  status?: string;
}) => {
  const doc = await prisma.aiGeneratedDocument.create({
    data: {
      userId,
      documentType,
      content,
      followUps,
      aiSuggestion,
      source,
      status
    }
  });
  return doc;
};
