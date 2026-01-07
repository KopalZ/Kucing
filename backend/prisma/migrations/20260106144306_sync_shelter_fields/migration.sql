-- AlterTable
ALTER TABLE `user` ADD COLUMN `documentKtp` VARCHAR(191) NULL,
    ADD COLUMN `shelterPhotos` TEXT NULL,
    MODIFY `shelterAddress` TEXT NULL;
