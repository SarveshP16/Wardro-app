-- Several categories per wardrobe piece, women's categories (dresses,
-- skirts, jumpsuits) with a per-profile gender setting, and more
-- occasions.
--
-- Hand-ordered (vs. Prisma's generated diff, which drops the old
-- `category` column first): every existing piece's single category is
-- copied into the new `categories` list before the old column goes.

-- AlterEnum (PostgreSQL 12+ allows several ADD VALUEs in one migration;
-- the new values aren't used below, so no commit is needed in between.)
ALTER TYPE "Category" ADD VALUE 'DRESS';
ALTER TYPE "Category" ADD VALUE 'SKIRT';
ALTER TYPE "Category" ADD VALUE 'JUMPSUIT';

-- AlterEnum
ALTER TYPE "Style" ADD VALUE 'WORK';
ALTER TYPE "Style" ADD VALUE 'INTERVIEW';
ALTER TYPE "Style" ADD VALUE 'DATE_NIGHT';
ALTER TYPE "Style" ADD VALUE 'PARTY';
ALTER TYPE "Style" ADD VALUE 'WEDDING_GUEST';
ALTER TYPE "Style" ADD VALUE 'ACTIVE';
ALTER TYPE "Style" ADD VALUE 'TRAVEL';
ALTER TYPE "Style" ADD VALUE 'BEACH';
ALTER TYPE "Style" ADD VALUE 'LOUNGE';

-- AlterTable: single category -> list, keeping every piece's category.
ALTER TABLE "ClothingItem" ADD COLUMN "categories" "Category"[];
UPDATE "ClothingItem" SET "categories" = ARRAY["category"];

-- DropIndex
DROP INDEX "ClothingItem_profileId_category_idx";

ALTER TABLE "ClothingItem" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "gender" TEXT NOT NULL DEFAULT 'all';

-- CreateIndex
CREATE INDEX "ClothingItem_profileId_idx" ON "ClothingItem"("profileId");
