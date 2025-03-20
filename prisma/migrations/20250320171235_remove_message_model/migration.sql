/*
  Warnings:

  - The primary key for the `_AppliedJobs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[A,B]` on the table `_AppliedJobs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- AlterTable
ALTER TABLE "_AppliedJobs" DROP CONSTRAINT "_AppliedJobs_AB_pkey";

-- DropTable
DROP TABLE "Message";

-- CreateIndex
CREATE UNIQUE INDEX "_AppliedJobs_AB_unique" ON "_AppliedJobs"("A", "B");
