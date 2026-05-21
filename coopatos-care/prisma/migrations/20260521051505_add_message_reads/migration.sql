-- CreateTable
CREATE TABLE "ReportMessageMedia" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "resourceType" TEXT DEFAULT 'image',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportMessageMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportMessageMedia_messageId_idx" ON "ReportMessageMedia"("messageId");

-- CreateIndex
CREATE INDEX "ReportMessageMedia_publicId_idx" ON "ReportMessageMedia"("publicId");

-- AddForeignKey
ALTER TABLE "ReportMessageMedia" ADD CONSTRAINT "ReportMessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ReportMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
