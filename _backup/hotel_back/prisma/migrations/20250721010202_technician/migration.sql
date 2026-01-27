/*
  Warnings:

  - You are about to drop the column `technician` on the `Maintenance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Maintenance" DROP COLUMN "technician",
ADD COLUMN     "technicianId" TEXT;

-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerId" TEXT,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;
