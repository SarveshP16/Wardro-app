import { Switch } from "@/components/ui/Switch";

/// Port of `outfit_category_toggles.dart` — whether outerwear/shoes are
/// even offered to the generator (both engines honor these).
export function OutfitCategoryToggles({
  includeOuterwear,
  includeShoes,
  onChangeOuterwear,
  onChangeShoes,
}: {
  includeOuterwear: boolean;
  includeShoes: boolean;
  onChangeOuterwear: (value: boolean) => void;
  onChangeShoes: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-5 py-1">
      <div className="flex items-center justify-between text-sm">
        <span>Include outerwear</span>
        <Switch
          checked={includeOuterwear}
          onChange={onChangeOuterwear}
          label="Include outerwear"
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Include shoes</span>
        <Switch
          checked={includeShoes}
          onChange={onChangeShoes}
          label="Include shoes"
        />
      </div>
    </div>
  );
}
