-- Set default after enum value is committed by previous migration
ALTER TABLE "subscriptions"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';
