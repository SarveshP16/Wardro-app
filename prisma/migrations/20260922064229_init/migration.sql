-- CreateEnum
CREATE TYPE "Category" AS ENUM ('TOP', 'BOTTOM', 'OUTERWEAR', 'SHOES');

-- CreateEnum
CREATE TYPE "Style" AS ENUM ('CASUAL', 'SMART_CASUAL', 'FORMAL', 'EVENING');

-- CreateTable
CREATE TABLE "ClothingItem" (
    "id" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "name" TEXT,
    "dominantColor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClothingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOutfit" (
    "id" TEXT NOT NULL,
    "style" "Style" NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedOutfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOutfitItem" (
    "outfitId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SavedOutfitItem_pkey" PRIMARY KEY ("outfitId","itemId")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "ClothingItem_category_idx" ON "ClothingItem"("category");

-- AddForeignKey
ALTER TABLE "SavedOutfitItem" ADD CONSTRAINT "SavedOutfitItem_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "SavedOutfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOutfitItem" ADD CONSTRAINT "SavedOutfitItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ClothingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
