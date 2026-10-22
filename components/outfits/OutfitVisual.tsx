"use client";

import { useLook } from "@/app/look-context";
import { itemImageSrc } from "@/components/ItemImage";
import { toHex } from "@/lib/color";
import { assignRoles, primaryCategory, type OutfitRole } from "@/lib/categories";
import { colorStoryCaption } from "@/lib/colorNames";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { ClothingItem } from "@/lib/types";

/// The picture of an outfit, drawn per look:
/// - Tailor's navy: a stylist's flat-lay -- every piece on one board,
///   overlapping roughly where it'd sit on a body.
/// - Colour story: the pieces in a lineup, then the outfit's palette as
///   a proportional colour band with a plain-language caption.
export function OutfitVisual({
  itemIds,
  itemsById,
}: {
  itemIds: string[];
  itemsById: Map<string, ClothingItem>;
}) {
  const look = useLook();
  const known = itemIds.flatMap((id) => {
    const item = itemsById.get(id);
    return item ? [item] : [];
  });
  // Which part each piece plays (a piece can be in several categories).
  const roles = assignRoles(known);
  const pieces = itemIds.map((id) => ({
    id,
    item: itemsById.get(id) ?? null,
    role: roles.get(id) ?? null,
  }));
  return look === "colour" ? (
    <ColourLineup pieces={pieces} />
  ) : (
    <FlatLay pieces={pieces} />
  );
}

type Piece = { id: string; item: ClothingItem | null; role: OutfitRole | null };

function pieceLabel(piece: Piece): string {
  return piece.item?.name ?? (piece.item ? CATEGORY_LABELS[primaryCategory(piece.item)] : "Item");
}

/* ---------------------------- Flat-lay ---------------------------- */

/// Position of one piece on the board, in % of the board's size.
type Slot = { left: number; top: number; width: number; height: number; z: number };

/// Where each role sits, depending on which others are present: the top
/// and outerwear share the upper half (side by side when both are there),
/// the bottom hangs below the top, a dress or jumpsuit takes the top and
/// bottom's place as one tall piece, and shoes go to the lower right.
function slotFor(role: OutfitRole, hasOuter: boolean, hasShoes: boolean): Slot {
  switch (role) {
    case "onepiece":
      return hasOuter
        ? { left: 40, top: 4, width: 56, height: 88, z: 2 }
        : { left: hasShoes ? 14 : 20, top: 3, width: hasShoes ? 56 : 60, height: 92, z: 2 };
    case "outerwear":
      return { left: 3, top: 6, width: 50, height: 47, z: 1 };
    case "top":
      return hasOuter
        ? { left: 44, top: 5, width: 52, height: 43, z: 2 }
        : { left: hasShoes ? 14 : 20, top: 4, width: hasShoes ? 58 : 60, height: 44, z: 2 };
    case "bottom":
      return hasOuter
        ? { left: hasShoes ? 20 : 29, top: 44, width: 42, height: 53, z: 1 }
        : { left: hasShoes ? 16 : 24, top: 45, width: hasShoes ? 46 : 52, height: 52, z: 1 };
    case "shoes":
      return hasOuter
        ? { left: 64, top: 70, width: 31, height: 24, z: 3 }
        : { left: 62, top: 68, width: 32, height: 26, z: 3 };
  }
}

function FlatLay({ pieces }: { pieces: Piece[] }) {
  const roles = pieces.map((p) => p.role);
  // The composed layout needs every piece known and in its own role, and
  // either a one-piece or top/bottom (not both); anything else (a deleted
  // item, two tops) falls back to a simple grid.
  const composable =
    pieces.length > 0 &&
    roles.every((r) => r !== null) &&
    !(roles.includes("onepiece") && (roles.includes("top") || roles.includes("bottom")));

  if (!composable) {
    return (
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-card bg-board p-3">
        {pieces.map((piece) => (
          <div key={piece.id} className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic, server-routed image */}
            <img
              src={itemImageSrc(piece.id)}
              alt={pieceLabel(piece)}
              className="garment-shadow absolute inset-0 h-full w-full object-contain p-2"
            />
          </div>
        ))}
      </div>
    );
  }

  const hasOuter = roles.includes("outerwear");
  const hasShoes = roles.includes("shoes");
  return (
    <div className="relative aspect-[4/4.3] w-full overflow-hidden rounded-card bg-board">
      {pieces.map((piece) => {
        const slot = slotFor(piece.role!, hasOuter, hasShoes);
        return (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic, server-routed image
          <img
            key={piece.id}
            src={itemImageSrc(piece.id)}
            alt={pieceLabel(piece)}
            className="garment-shadow absolute object-contain"
            style={{
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
              zIndex: slot.z,
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------- Colour lineup ------------------------- */

/// Relative width of each piece's colour in the band -- roughly how much
/// of the outfit you see of it.
const BAND_WEIGHT: Record<OutfitRole, number> = {
  top: 3,
  outerwear: 3,
  bottom: 3,
  onepiece: 6,
  shoes: 1,
};

/// Lineup order: outer layer first, shoes last.
const LINEUP_ORDER: Record<OutfitRole, number> = {
  outerwear: 0,
  top: 1,
  onepiece: 1,
  bottom: 2,
  shoes: 3,
};

function ColourLineup({ pieces }: { pieces: Piece[] }) {
  const ordered = [...pieces].sort(
    (a, b) =>
      (a.role ? LINEUP_ORDER[a.role] : 9) - (b.role ? LINEUP_ORDER[b.role] : 9),
  );
  const colored = ordered.filter(
    (p): p is Piece & { item: ClothingItem & { dominantColor: number } } =>
      p.item?.dominantColor != null,
  );
  const columns = ordered.length === 4 ? 2 : Math.min(ordered.length, 3);

  return (
    <div>
      <div
        className="grid gap-px bg-line"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {ordered.map((piece) => (
          <div
            key={piece.id}
            className={`relative bg-board ${columns === 2 ? "aspect-square" : "aspect-[3/4]"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic, server-routed image */}
            <img
              src={itemImageSrc(piece.id)}
              alt={pieceLabel(piece)}
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
          </div>
        ))}
      </div>
      {colored.length > 0 ? (
        <>
          <div className="flex h-6" aria-hidden>
            {colored.map((piece) => (
              <span
                key={piece.id}
                style={{
                  flex: piece.role ? BAND_WEIGHT[piece.role] : 2,
                  backgroundColor: toHex(piece.item.dominantColor),
                }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {colorStoryCaption(colored.map((p) => p.item.dominantColor))}
          </p>
        </>
      ) : null}
    </div>
  );
}
