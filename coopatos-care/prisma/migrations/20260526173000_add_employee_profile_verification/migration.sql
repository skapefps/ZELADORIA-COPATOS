ALTER TABLE "Employee" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "Employee" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "Employee" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Employee" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "Employee" ADD COLUMN "emailVerificationSentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Employee_emailVerificationToken_key" ON "Employee"("emailVerificationToken");
