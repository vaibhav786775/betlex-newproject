/*
  Warnings:

  - You are about to drop the column `created_at` on the `scores` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `scores` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `scores` table. All the data in the column will be lost.
  - Added the required column `impact` to the `scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `innovation` to the `scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `presentation` to the `scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `technical` to the `scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `scores` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "scores" DROP COLUMN "created_at",
DROP COLUMN "feedback",
DROP COLUMN "rating",
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "impact" INTEGER NOT NULL,
ADD COLUMN     "innovation" INTEGER NOT NULL,
ADD COLUMN     "presentation" INTEGER NOT NULL,
ADD COLUMN     "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "technical" INTEGER NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "event_judges" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "judge_id" TEXT NOT NULL,
    "track" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,

    CONSTRAINT "event_judges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_judges_event_id_judge_id_key" ON "event_judges"("event_id", "judge_id");

-- AddForeignKey
ALTER TABLE "event_judges" ADD CONSTRAINT "event_judges_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_judges" ADD CONSTRAINT "event_judges_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_judges" ADD CONSTRAINT "event_judges_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
