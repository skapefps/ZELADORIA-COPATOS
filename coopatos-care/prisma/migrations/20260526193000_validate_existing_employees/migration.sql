UPDATE "Employee"
SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", CURRENT_TIMESTAMP),
    "emailVerificationToken" = NULL,
    "emailVerificationSentAt" = NULL
WHERE "email" IS NOT NULL;
