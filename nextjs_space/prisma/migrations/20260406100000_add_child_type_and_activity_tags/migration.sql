-- Add childType to ChildProfile
ALTER TABLE "ChildProfile" ADD COLUMN IF NOT EXISTS "childType" TEXT NOT NULL DEFAULT 'general';

-- Add ageGroup and isABAPlus to Activity
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "ageGroup" TEXT NOT NULL DEFAULT 'all';
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "isABAPlus" BOOLEAN NOT NULL DEFAULT false;
