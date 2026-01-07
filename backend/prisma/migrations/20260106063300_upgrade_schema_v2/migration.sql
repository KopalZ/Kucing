/*
  Warnings:

  - You are about to alter the column `status` on the `report` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - Added the required column `address` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Adoption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shelterId` to the `Cat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `report` DROP FOREIGN KEY `Report_userId_fkey`;

-- AlterTable
ALTER TABLE `adoption` ADD COLUMN `address` TEXT NOT NULL,
    ADD COLUMN `houseImage` VARCHAR(191) NULL,
    ADD COLUMN `idCardImage` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'INTERVIEW', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `cat` ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `shelterId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `report` ADD COLUMN `guestContact` VARCHAR(191) NULL,
    ADD COLUMN `guestName` VARCHAR(191) NULL,
    MODIFY `userId` INTEGER NULL,
    MODIFY `status` ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `isShelterVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `shelterAddress` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Campaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `targetAmount` DECIMAL(65, 30) NOT NULL,
    `currentAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `imageUrl` VARCHAR(191) NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `shelterId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Donation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(65, 30) NOT NULL,
    `message` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `campaignId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cat` ADD CONSTRAINT `Cat_shelterId_fkey` FOREIGN KEY (`shelterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Campaign` ADD CONSTRAINT `Campaign_shelterId_fkey` FOREIGN KEY (`shelterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
