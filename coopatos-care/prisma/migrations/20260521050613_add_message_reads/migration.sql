-- AlterTable
ALTER TABLE "ReportMessage" ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "resourceType" TEXT DEFAULT 'image';
