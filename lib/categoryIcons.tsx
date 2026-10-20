import { CloudSnow, Footprints, Layers, Shirt } from "lucide-react";
import type { ComponentType } from "react";

import type { ClothingCategory } from "./types";

/// Icon per clothing category.
export const CATEGORY_ICONS: Record<
  ClothingCategory,
  ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
> = {
  top: Shirt,
  bottom: Layers,
  outerwear: CloudSnow,
  shoes: Footprints,
};
