-- AlterTable
ALTER TABLE "PrivateMessage" ADD COLUMN     "replyToMessageId" INTEGER;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "PrivateMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
