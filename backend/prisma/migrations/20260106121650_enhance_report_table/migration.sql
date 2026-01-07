/*
  Warnings:

  - You are about to drop the column `guestContact` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `guestName` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `report` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `report` table. All the data in the column will be lost.
  - The values [IN_PROGRESS,RESOLVED] on the enum `Report_status` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `address` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conditionTags` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Made the column `imageUrl` on table `report` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `report` DROP COLUMN `guestContact`,
    DROP COLUMN `guestName`,
    DROP COLUMN `location`,
    DROP COLUMN `title`,
    ADD COLUMN `address` TEXT NOT NULL,
    ADD COLUMN `conditionTags` VARCHAR(191) NOT NULL,
    ADD COLUMN `latitude` DOUBLE NOT NULL,
    ADD COLUMN `longitude` DOUBLE NOT NULL,
    ADD COLUMN `reporterName` VARCHAR(191) NULL,
    ADD COLUMN `reporterPhone` VARCHAR(191) NULL,
    ADD COLUMN `videoUrl` VARCHAR(191) NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `imageUrl` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'VERIFIED', 'ON_PROCESS', 'RESCUED', 'REJECTED') NOT NULL DEFAULT 'PENDING';
