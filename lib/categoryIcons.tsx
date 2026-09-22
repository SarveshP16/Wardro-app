import { CloudSnow, Footprints, Layers, Shirt } from "lucide-react";
import type { ComponentType } from "react";

import type { ClothingCategory } from "./types";

/// Icon per category, standing in for the Material icons used in
/// clothing_category.dart (checkroom / dry_cleaning / ac_unit / hiking).
export const CATEGORY_ICONS: Record<
  ClothingCategory,
  ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
> = {
  top: Shirt,
  bottom: Layers,
  outerwear: CloudSnow,
  shoes: Footprints,
};
