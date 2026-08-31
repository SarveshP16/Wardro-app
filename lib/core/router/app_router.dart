import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/outfits/presentation/screens/outfits_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/wardrobe/domain/clothing_item.dart';
import '../../features/wardrobe/presentation/screens/add_item_screen.dart';
import '../../features/wardrobe/presentation/screens/edit_item_screen.dart';
import '../../features/wardrobe/presentation/screens/item_detail_screen.dart';
import '../../features/wardrobe/presentation/screens/wardrobe_screen.dart';
import 'app_routes.dart';
import 'app_shell.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.wardrobe,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.wardrobe,
                builder: (context, state) => const WardrobeScreen(),
                routes: [
                  GoRoute(
                    path: AppRoutes.addItem,
                    builder: (context, state) => const AddItemScreen(),
                  ),
                  GoRoute(
                    path: '${AppRoutes.itemDetail}/:id',
                    builder: (context, state) => ItemDetailScreen(
                      itemId: state.pathParameters['id']!,
                    ),
                    routes: [
                      GoRoute(
                        path: AppRoutes.editItem,
                        builder: (context, state) => EditItemScreen(
                          item: state.extra as ClothingItem,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.outfits,
                builder: (context, state) => const OutfitsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.settings,
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
