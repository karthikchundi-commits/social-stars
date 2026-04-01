-- CreateTable
CREATE TABLE "EmotionDetectionEvent" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityId" TEXT,
    "sessionId" TEXT NOT NULL,
    "detectedEmotion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmotionDetectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfusionEvent" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "hesitationMs" INTEGER,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "questionCtx" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConfusionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAdaptation" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "difficultyLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "preferredTypes" TEXT NOT NULL DEFAULT '[]',
    "confusionAreas" TEXT NOT NULL DEFAULT '{}',
    "totalHints" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearningAdaptation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningAdaptation_childId_key" ON "LearningAdaptation"("childId");

-- AddForeignKey
ALTER TABLE "EmotionDetectionEvent" ADD CONSTRAINT "EmotionDetectionEvent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfusionEvent" ADD CONSTRAINT "ConfusionEvent_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAdaptation" ADD CONSTRAINT "LearningAdaptation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
