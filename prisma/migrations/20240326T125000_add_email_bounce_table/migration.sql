-- CreateEnum
CREATE TYPE "BounceType" AS ENUM ('HARD', 'SOFT', 'UNDETERMINED');

-- CreateEnum
CREATE TYPE "BounceStatus" AS ENUM ('NEW', 'PROCESSED', 'IGNORED', 'RESOLVED');

-- CreateTable
CREATE TABLE "EmailBounce" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "messageId" TEXT,
    "bounceType" "BounceType" NOT NULL DEFAULT 'UNDETERMINED',
    "bounceCategory" TEXT,
    "reason" TEXT,
    "action" TEXT,
    "status" "BounceStatus" NOT NULL DEFAULT 'NEW',
    "diagnosticCode" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "retryAfter" TIMESTAMP(3),
    "handled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmailBounce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailBounce_email_idx" ON "EmailBounce"("email");

-- CreateIndex
CREATE INDEX "EmailBounce_bounceType_idx" ON "EmailBounce"("bounceType");

-- CreateIndex
CREATE INDEX "EmailBounce_status_idx" ON "EmailBounce"("status");

-- CreateIndex
CREATE INDEX "EmailBounce_timestamp_idx" ON "EmailBounce"("timestamp"); 