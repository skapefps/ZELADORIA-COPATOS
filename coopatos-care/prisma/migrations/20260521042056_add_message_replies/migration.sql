-- AlterTable
ALTER TABLE "ReportMessage" ADD COLUMN     "replyToMessageId" INTEGER;

-- AddForeignKey
ALTER TABLE "ReportMessage" ADD CONSTRAINT "ReportMessage_replyToMessageId_fkey" FOREIGN KEY ("replyToMessageId") REFERENCES "ReportMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
