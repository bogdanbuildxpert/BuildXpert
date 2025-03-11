-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'PHONE');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "preferredContact" "ContactMethod" NOT NULL DEFAULT 'EMAIL';
