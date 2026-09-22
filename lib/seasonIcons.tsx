import { Flower2, Leaf, Snowflake, Sun } from "lucide-react";
import type { ComponentType } from "react";

import type { Season } from "./types";

export const SEASON_ICONS: Record<
  Season,
  ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
> = {
  spring: Flower2,
  summer: Sun,
  autumn: Leaf,
  winter: Snowflake,
};
