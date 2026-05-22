-- CreateTable
CREATE TABLE "PrivateMessageMedia" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "resourceType" TEXT DEFAULT 'image',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateMessageMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrivateMessageMedia_messageId_idx" ON "PrivateMessageMedia"("messageId");

-- AddForeignKey
ALTER TABLE "PrivateMessageMedia" ADD CONSTRAINT "PrivateMessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "PrivateMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
