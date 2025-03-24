-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cookiePreferences" JSONB DEFAULT '{"essential":true,"analytics":true,"preferences":true}';
