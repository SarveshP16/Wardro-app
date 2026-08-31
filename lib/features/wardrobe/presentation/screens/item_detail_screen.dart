import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_snackbar.dart';
import '../../application/wardrobe_providers.dart';
import '../../domain/clothing_category.dart';
import '../../domain/clothing_item.dart';

/// Full-screen view of a single wardrobe item, with a delete action.
/// Reads the item live from [wardrobeItemsProvider] so if it's deleted
/// elsewhere the screen doesn't show stale data.
class ItemDetailScreen extends ConsumerWidget {
  const ItemDetailScreen({super.key, required this.itemId});

  final String itemId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(wardrobeItemsProvider);
    final item = items.cast<ClothingItem?>().firstWhere(
      (i) => i?.id == itemId,
      orElse: () => null,
    );

    if (item == null) {
      return const Scaffold(body: Center(child: Text('Item removed')));
    }

    final brightness = Theme.of(context).brightness;
    final accent = item.category.color(brightness);

    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit',
            onPressed: () => context.push(
              AppRoutes.editItemPath(item.id),
              extra: item,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete',
            onPressed: () => _confirmDelete(context, ref, item),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.photoBackdrop,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Hero(
                    tag: 'wardrobe-item-${item.id}',
                    child: Image.file(File(item.imagePath), fit: BoxFit.contain),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
                    child: Icon(item.category.icon, size: 16, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Text(item.category.label, style: Theme.of(context).textTheme.titleMedium),
                ],
              ),
              if (item.name != null) ...[
                const SizedBox(height: 8),
                Text(item.name!, style: Theme.of(context).textTheme.headlineMedium),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    ClothingItem item,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this item?'),
        content: const Text('This removes it from your wardrobe permanently.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    await ref.read(wardrobeItemsProvider.notifier).delete(item.id);
    navigator.pop();
    showAppSnackBar(messenger, 'Item deleted');
  }
}
