/*
  Warnings:

  - You are about to drop the `_keywordtopost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_keywordtopost` DROP FOREIGN KEY `_KeywordToPost_A_fkey`;

-- DropForeignKey
ALTER TABLE `_keywordtopost` DROP FOREIGN KEY `_KeywordToPost_B_fkey`;

-- DropForeignKey
ALTER TABLE `likes` DROP FOREIGN KEY `likes_postId_fkey`;

-- DropForeignKey
ALTER TABLE `likes` DROP FOREIGN KEY `likes_userId_fkey`;

-- DropForeignKey
ALTER TABLE `posts` DROP FOREIGN KEY `posts_userId_fkey`;

-- AlterTable
ALTER TABLE `questions` ADD COLUMN `difficulty` VARCHAR(20) NOT NULL DEFAULT 'easy';

-- DropTable
DROP TABLE `_keywordtopost`;

-- DropTable
DROP TABLE `likes`;

-- DropTable
DROP TABLE `posts`;

-- DropTable
DROP TABLE `user`;
