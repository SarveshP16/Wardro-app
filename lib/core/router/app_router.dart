import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/outfits/presentation/screens/outfits_placeholder_screen.dart';
import '../../features/wardrobe/presentation/screens/add_item_screen.dart';
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
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.outfits,
                builder: (context, state) => const OutfitsPlaceholderScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
