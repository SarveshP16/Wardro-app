-- Up to 3 main colours per wardrobe piece (lib/palette.ts), for the
-- colour-scheme matching in Quick Match. Additive and nullable: existing
-- pieces are filled in by a background pass at server start.

-- AlterTable
ALTER TABLE "ClothingItem" ADD COLUMN "palette" JSONB;
