/// Central registry of route paths/names, so screens never hardcode a
/// path string that could drift from what's registered in [appRouter].
class AppRoutes {
  AppRoutes._();

  static const wardrobe = '/wardrobe';
  static const outfits = '/outfits';

  static const addItem = 'add-item';
  static const itemDetail = 'item';
  static const editItem = 'edit';
  static const settings = '/settings';

  static String itemDetailPath(String id) => '/wardrobe/item/$id';
  static String editItemPath(String id) => '${itemDetailPath(id)}/$editItem';
}
