-- Remembers every outfit the AI Stylist has shown a profile, so it never
-- suggests the same combination twice. Additive only: existing data is
-- untouched.

-- CreateTable
CREATE TABLE "SuggestedOutfit" (
    "profileId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestedOutfit_pkey" PRIMARY KEY ("profileId","signature")
);

-- CreateIndex
CREATE INDEX "SuggestedOutfit_profileId_createdAt_idx" ON "SuggestedOutfit"("profileId", "createdAt");

-- AddForeignKey
ALTER TABLE "SuggestedOutfit" ADD CONSTRAINT "SuggestedOutfit_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

