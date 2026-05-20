-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "ReportMessage" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportMessage_reportId_idx" ON "ReportMessage"("reportId");

-- CreateIndex
CREATE INDEX "ReportMessage_senderId_idx" ON "ReportMessage"("senderId");

-- AddForeignKey
ALTER TABLE "ReportMessage" ADD CONSTRAINT "ReportMessage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportMessage" ADD CONSTRAINT "ReportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
