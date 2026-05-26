CREATE TABLE "ReportNote" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportNote_reportId_idx" ON "ReportNote"("reportId");
CREATE INDEX "ReportNote_authorId_idx" ON "ReportNote"("authorId");
CREATE INDEX "ReportNote_createdAt_idx" ON "ReportNote"("createdAt");

ALTER TABLE "ReportNote" ADD CONSTRAINT "ReportNote_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReportNote" ADD CONSTRAINT "ReportNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
