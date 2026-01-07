/*
  Warnings:

  - Made the column `images` on table `cat` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `cat` MODIFY `images` TEXT NOT NULL;
