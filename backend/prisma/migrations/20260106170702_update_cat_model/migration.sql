/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `cat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cat` DROP COLUMN `imageUrl`,
    ADD COLUMN `health` VARCHAR(191) NULL,
    ADD COLUMN `images` TEXT NULL,
    ADD COLUMN `personality` VARCHAR(191) NULL;
