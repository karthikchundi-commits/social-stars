ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "therapistId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LiveSession_therapistId_fkey'
  ) THEN
    ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_therapistId_fkey"
      FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CircleTimeSchedule" (
    "id"          TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "dayOfWeek"   INTEGER NOT NULL,
    "timeOfDay"   TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "activityId"  TEXT,
    "notes"       TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CircleTimeSchedule_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CircleTimeSchedule_therapistId_fkey'
  ) THEN
    ALTER TABLE "CircleTimeSchedule" ADD CONSTRAINT "CircleTimeSchedule_therapistId_fkey"
      FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
