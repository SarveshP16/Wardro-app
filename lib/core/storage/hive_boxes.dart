/// Central registry of Hive box names, so a typo can't silently open a
/// second box instead of the one every other file uses.
class HiveBoxes {
  HiveBoxes._();

  static const wardrobeItems = 'wardrobe_items';
  static const savedOutfits = 'saved_outfits';
}
