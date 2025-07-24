/*
  Warnings:

  - You are about to drop the column `caseNumber` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `claimants` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `court` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `motionType` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `respondents` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `AiGeneratedDocument` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[documentId]` on the table `AiGeneratedDocument` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `documentId` to the `AiGeneratedDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiGeneratedDocument" DROP COLUMN "caseNumber",
DROP COLUMN "claimants",
DROP COLUMN "content",
DROP COLUMN "court",
DROP COLUMN "documentType",
DROP COLUMN "fileUrl",
DROP COLUMN "motionType",
DROP COLUMN "name",
DROP COLUMN "respondents",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "documentId" TEXT NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'ai',
ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateIndex
CREATE UNIQUE INDEX "AiGeneratedDocument_documentId_key" ON "AiGeneratedDocument"("documentId");

-- AddForeignKey
ALTER TABLE "AiGeneratedDocument" ADD CONSTRAINT "AiGeneratedDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
