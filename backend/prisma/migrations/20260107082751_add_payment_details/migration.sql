/*
  Warnings:

  - You are about to alter the column `amount` on the `donation` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Int`.
  - Made the column `userId` on table `donation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `donation` DROP FOREIGN KEY `Donation_userId_fkey`;

-- AlterTable
ALTER TABLE `donation` ADD COLUMN `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    MODIFY `amount` INTEGER NOT NULL,
    MODIFY `message` TEXT NULL,
    MODIFY `userId` INTEGER NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
