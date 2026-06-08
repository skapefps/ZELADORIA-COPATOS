CREATE TABLE "BrandSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "preset" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandSetting_pkey" PRIMARY KEY ("id")
);
