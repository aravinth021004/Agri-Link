-- Allow Google OAuth users to exist without phone/password at signup.
ALTER TABLE "users"
  ALTER COLUMN "phone" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL;
