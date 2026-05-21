-- CreateTable
CREATE TABLE "ReportMessageRead" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "lastReadMessageId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportMessageRead_reportId_idx" ON "ReportMessageRead"("reportId");

-- CreateIndex
CREATE INDEX "ReportMessageRead_employeeId_idx" ON "ReportMessageRead"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportMessageRead_reportId_employeeId_key" ON "ReportMessageRead"("reportId", "employeeId");

-- AddForeignKey
ALTER TABLE "ReportMessageRead" ADD CONSTRAINT "ReportMessageRead_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportMessageRead" ADD CONSTRAINT "ReportMessageRead_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
