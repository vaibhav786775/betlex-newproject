-- AlterTable
ALTER TABLE "events" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_leaderboard_published" BOOLEAN NOT NULL DEFAULT false;
