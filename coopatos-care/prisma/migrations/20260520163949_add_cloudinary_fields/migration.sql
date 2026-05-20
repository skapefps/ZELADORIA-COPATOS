-- AlterTable
ALTER TABLE "ReportImage" ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "resourceType" TEXT DEFAULT 'image';

-- CreateIndex
CREATE INDEX "ReportImage_publicId_idx" ON "ReportImage"("publicId");
