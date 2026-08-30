import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/section_header.dart';
import '../../application/wardrobe_providers.dart';
import '../widgets/category_filter_bar.dart';
import '../widgets/wardrobe_grid.dart';

/// The app's home screen: every saved wardrobe item, filterable by
/// category, with a floating action button to add a new one.
class WardrobeScreen extends ConsumerWidget {
  const WardrobeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(filteredWardrobeItemsProvider);
    final hasAnyItems = ref.watch(wardrobeItemsProvider).isNotEmpty;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 16),
              child: SectionHeader(
                title: 'Your wardrobe',
                subtitle: 'Every piece, ready to be styled.',
              ),
            ),
            const CategoryFilterBar(),
            const SizedBox(height: 8),
            Expanded(
              child: !hasAnyItems
                  ? EmptyState(
                      icon: Icons.checkroom_outlined,
                      title: 'Your closet is empty',
                      message:
                          'Add your first piece — snap a photo and Wardro '
                          'will clean it up automatically.',
                      action: FilledButton.icon(
                        onPressed: () =>
                            context.push('${AppRoutes.wardrobe}/${AppRoutes.addItem}'),
                        icon: const Icon(Icons.add_a_photo_outlined),
                        label: const Text('Add your first item'),
                      ),
                    )
                  : items.isEmpty
                  ? const EmptyState(
                      icon: Icons.filter_alt_off_outlined,
                      title: 'Nothing here yet',
                      message: 'No items in this category yet.',
                    )
                  : WardrobeGrid(
                      items: items,
                      onItemTap: (item) => context.push(
                        AppRoutes.itemDetailPath(item.id),
                      ),
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: hasAnyItems
          ? FloatingActionButton.extended(
              onPressed: () =>
                  context.push('${AppRoutes.wardrobe}/${AppRoutes.addItem}'),
              icon: const Icon(Icons.add_a_photo_outlined),
              label: const Text('Add item'),
            )
          : null,
    );
  }
}
