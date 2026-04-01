CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiveParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "childId" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#818CF8',
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "currentEmotion" TEXT NOT NULL DEFAULT 'neutral',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LiveSession_joinCode_key" ON "LiveSession"("joinCode");
CREATE INDEX "LiveParticipant_sessionId_idx" ON "LiveParticipant"("sessionId");

ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_activityId_fkey"
  FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiveParticipant" ADD CONSTRAINT "LiveParticipant_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
