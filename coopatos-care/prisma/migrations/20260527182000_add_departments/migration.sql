CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");
CREATE INDEX "Department_name_idx" ON "Department"("name");
CREATE INDEX "Department_active_idx" ON "Department"("active");

INSERT INTO "Department" ("name", "description", "color", "active", "updatedAt")
SELECT DISTINCT TRIM("department"), 'Departamento importado dos funcionários existentes.', '#2563eb', true, CURRENT_TIMESTAMP
FROM "Employee"
WHERE "department" IS NOT NULL AND TRIM("department") <> ''
ON CONFLICT ("name") DO NOTHING;
