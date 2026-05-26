CREATE TABLE "ReportNoteMedia" (
    "id" SERIAL NOT NULL,
    "noteId" INTEGER NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "resourceType" TEXT DEFAULT 'image',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportNoteMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportNoteMedia_noteId_idx" ON "ReportNoteMedia"("noteId");
CREATE INDEX "ReportNoteMedia_publicId_idx" ON "ReportNoteMedia"("publicId");

ALTER TABLE "ReportNoteMedia" ADD CONSTRAINT "ReportNoteMedia_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ReportNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
