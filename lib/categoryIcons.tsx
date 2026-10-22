import { CloudSnow, Footprints, Layers, Shirt } from "lucide-react";
import type { ComponentType } from "react";

import type { ClothingCategory } from "./types";

type IconProps = { size?: number; strokeWidth?: number; className?: string };

/// Line icons in lucide's style (24px grid, round caps) for the categories
/// lucide has no icon for.
function lineIcon(paths: string[]): ComponentType<IconProps> {
  function Icon({ size = 24, strokeWidth = 2, className }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  return Icon;
}

const Dress = lineIcon([
  "M9 2v3L7 9l2 1-4 12h14l-4-12 2-1-2-4V2",
  "M9 10h6",
]);
const Skirt = lineIcon(["M7 3h10l3 18H4z", "M7 7h10"]);
const Jumpsuit = lineIcon([
  "M9 2v4L7 9v13h4l1-8 1 8h4V9l-2-3V2",
  "M7 13h10",
]);

/// Icon per clothing category.
export const CATEGORY_ICONS: Record<
  ClothingCategory,
  ComponentType<IconProps>
> = {
  top: Shirt,
  bottom: Layers,
  skirt: Skirt,
  dress: Dress,
  jumpsuit: Jumpsuit,
  outerwear: CloudSnow,
  shoes: Footprints,
};
