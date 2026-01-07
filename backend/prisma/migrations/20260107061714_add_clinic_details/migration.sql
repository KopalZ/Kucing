-- AlterTable
ALTER TABLE `user` ADD COLUMN `catsRescued` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `operatingYear` INTEGER NULL,
    ADD COLUMN `services` TEXT NULL;
