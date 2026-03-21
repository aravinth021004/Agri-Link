-- AlterEnum
ALTER TYPE "SubStatus" ADD VALUE IF NOT EXISTS 'PENDING';

-- AlterTable
ALTER TABLE "subscriptions"
  ALTER COLUMN "startDate" DROP NOT NULL,
  ALTER COLUMN "endDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "upiRefId" TEXT;

-- CreateTable
CREATE TABLE "platform_settings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "upiId" TEXT NOT NULL,
  "upiName" TEXT NOT NULL,

  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
