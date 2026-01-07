/*
  Warnings:

  - You are about to drop the column `address` on the `adoption` table. All the data in the column will be lost.
  - You are about to drop the column `houseImage` on the `adoption` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeStatus` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `houseImages` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ktpNumber` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `movingPlan` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stayingWith` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Made the column `idCardImage` on table `adoption` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `adoption` DROP COLUMN `address`,
    DROP COLUMN `houseImage`,
    ADD COLUMN `childAges` VARCHAR(191) NULL,
    ADD COLUMN `fullName` VARCHAR(191) NOT NULL,
    ADD COLUMN `hasExperience` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `homeStatus` VARCHAR(191) NOT NULL,
    ADD COLUMN `houseImages` TEXT NOT NULL,
    ADD COLUMN `isCommitted` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isPermitted` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `job` VARCHAR(191) NOT NULL,
    ADD COLUMN `ktpNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `movingPlan` TEXT NOT NULL,
    ADD COLUMN `socialMedia` VARCHAR(191) NULL,
    ADD COLUMN `stayingWith` VARCHAR(191) NOT NULL,
    MODIFY `idCardImage` VARCHAR(191) NOT NULL;
