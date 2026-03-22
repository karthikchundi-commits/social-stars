ALTER TABLE "LiveSession" ADD COLUMN "therapistId" TEXT;

ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_therapistId_fkey"
  FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CircleTimeSchedule" (
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

ALTER TABLE "CircleTimeSchedule" ADD CONSTRAINT "CircleTimeSchedule_therapistId_fkey"
  FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
