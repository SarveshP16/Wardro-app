-- Multi-profile support: every wardrobe item and saved outfit now
-- belongs to a Profile, and the theme setting moves onto the profile
-- (alongside the new per-profile visual style, `look`).
--
-- Hand-ordered (vs. Prisma's generated diff) so existing data survives:
-- if the database already has items or outfits, they're adopted by a
-- "Me" profile (rename it in Settings) that inherits the old global
-- theme, before the new columns become NOT NULL. A fresh install gets
-- no profile and starts on the profile picker instead.

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "themeMode" TEXT NOT NULL DEFAULT 'system',
    "look" TEXT NOT NULL DEFAULT 'navy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_name_key" ON "Profile"("name");

-- Backfill: adopt pre-profile data into a default profile.
INSERT INTO "Profile" ("id", "name", "color", "themeMode")
SELECT
    'default-profile',
    'Me',
    'navy',
    COALESCE(
        (SELECT "value" FROM "Setting" WHERE "key" = 'themeMode'),
        'system'
    )
WHERE EXISTS (SELECT 1 FROM "ClothingItem")
   OR EXISTS (SELECT 1 FROM "SavedOutfit");

-- AlterTable
ALTER TABLE "ClothingItem" ADD COLUMN "profileId" TEXT;
UPDATE "ClothingItem" SET "profileId" = 'default-profile';
ALTER TABLE "ClothingItem" ALTER COLUMN "profileId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SavedOutfit" ADD COLUMN "profileId" TEXT;
UPDATE "SavedOutfit" SET "profileId" = 'default-profile';
ALTER TABLE "SavedOutfit" ALTER COLUMN "profileId" SET NOT NULL;

-- DropTable (its only key, themeMode, now lives on Profile)
DROP TABLE "Setting";

-- DropIndex
DROP INDEX "ClothingItem_category_idx";

-- CreateIndex
CREATE INDEX "ClothingItem_profileId_category_idx" ON "ClothingItem"("profileId", "category");

-- CreateIndex
CREATE INDEX "SavedOutfit_profileId_idx" ON "SavedOutfit"("profileId");

-- AddForeignKey
ALTER TABLE "ClothingItem" ADD CONSTRAINT "ClothingItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOutfit" ADD CONSTRAINT "SavedOutfit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
