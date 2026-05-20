-- CreateTable
CREATE TABLE "ReportParticipant" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARTICIPANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportParticipant_reportId_idx" ON "ReportParticipant"("reportId");

-- CreateIndex
CREATE INDEX "ReportParticipant_employeeId_idx" ON "ReportParticipant"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportParticipant_reportId_employeeId_key" ON "ReportParticipant"("reportId", "employeeId");

-- AddForeignKey
ALTER TABLE "ReportParticipant" ADD CONSTRAINT "ReportParticipant_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportParticipant" ADD CONSTRAINT "ReportParticipant_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
