import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const saveAiGeneratedDocument = async ({
  userId,
  documentType,
  content,
  followUps = [],
  aiSuggestion = '',
  source = 'form',
  status = 'draft',
  title = 'Untitled',
  name = '',
  court = '',
  motionType = '',
  caseNumber = '',
  claimants = '',
  respondents = '',
  fileUrl = '',
  type = documentType
}: {
  userId: string;
  documentType: string;
  content: string;
  followUps?: Array<{ question: string; answer: string }>;
  aiSuggestion?: string;
  source?: string;
  status?: string;
  title?: string;
  name?: string;
  court?: string;
  motionType?: string;
  caseNumber?: string;
  claimants?: string;
  respondents?: string;
  fileUrl?: string;
  type?: string;
}) => {
  try {
    console.log("➡️ Saving Document...");
    const savedDoc = await prisma.document.create({
      data: {
        userId,
        title,
        type,
        fileUrl,
        content,
        name,
        court,
        motionType,
        caseNumber,
        claimants,
        respondents,
        source,
        status
      }
    });

    console.log("✅ Document saved with ID:", savedDoc.id);

    console.log("➡️ Saving AI-generated metadata...");
    const aiDoc = await prisma.aiGeneratedDocument.create({
      data: {
        userId,
        documentId: savedDoc.id,
        followUps,
        aiSuggestion,
        source,
        status
      }
    });

    console.log("✅ AI Document saved:", aiDoc.id);

    return { aiDoc, savedDoc };
  } catch (error) {
    console.error("❌ Error in saveAiGeneratedDocument:", error);
    throw error;
  }
};
