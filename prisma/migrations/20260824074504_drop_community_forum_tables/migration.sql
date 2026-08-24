/*
  Warnings:

  - You are about to drop the `community_post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_reply` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "community_post" DROP CONSTRAINT "community_post_author_user_id_fkey";

-- DropForeignKey
ALTER TABLE "community_reply" DROP CONSTRAINT "community_reply_author_user_id_fkey";

-- DropForeignKey
ALTER TABLE "community_reply" DROP CONSTRAINT "community_reply_post_id_fkey";

-- DropTable
DROP TABLE "community_post";

-- DropTable
DROP TABLE "community_reply";
