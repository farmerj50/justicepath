-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "source" TEXT DEFAULT 'form',
ADD COLUMN     "status" TEXT DEFAULT 'draft';
