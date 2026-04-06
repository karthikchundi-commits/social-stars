-- Add location and bio fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

-- Create TherapistSubscriptionPlan
CREATE TABLE IF NOT EXISTS "TherapistSubscriptionPlan" (
  "id" TEXT NOT NULL,
  "therapistId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "pricePerMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "features" TEXT NOT NULL DEFAULT '[]',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TherapistSubscriptionPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TherapistSubscriptionPlan_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create FamilySubscription
CREATE TABLE IF NOT EXISTS "FamilySubscription" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "therapistId" TEXT NOT NULL,
  "planId" TEXT,
  "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "customPrice" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'active',
  "notes" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilySubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FamilySubscription_parentId_key" UNIQUE ("parentId"),
  CONSTRAINT "FamilySubscription_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "FamilySubscription_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "FamilySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TherapistSubscriptionPlan"("id") ON DELETE SET NULL
);

-- Create GroupDiscount
CREATE TABLE IF NOT EXISTS "GroupDiscount" (
  "id" TEXT NOT NULL,
  "therapistId" TEXT NOT NULL,
  "planId" TEXT,
  "name" TEXT NOT NULL,
  "minFamilies" INTEGER NOT NULL,
  "discountPercent" DOUBLE PRECISION NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroupDiscount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GroupDiscount_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "GroupDiscount_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TherapistSubscriptionPlan"("id") ON DELETE SET NULL
);
