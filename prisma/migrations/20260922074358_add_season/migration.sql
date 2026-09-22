-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');

-- AlterTable
ALTER TABLE "SavedOutfit" ADD COLUMN     "season" "Season";
