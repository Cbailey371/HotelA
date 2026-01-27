-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "code" VARCHAR(10) NOT NULL DEFAULT '10000';

-- AlterTable
ALTER TABLE "MaintenanceLog" ADD COLUMN     "videoUrl" TEXT;
