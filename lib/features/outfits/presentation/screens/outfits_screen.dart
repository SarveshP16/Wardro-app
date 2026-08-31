import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/app_snackbar.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../core/widgets/staggered_entrance.dart';
import '../../../wardrobe/application/wardrobe_providers.dart';
import '../../../wardrobe/domain/clothing_item.dart';
import '../../application/outfit_providers.dart';
import '../widgets/outfit_generating_view.dart';
import '../widgets/outfit_mode_toggle.dart';
import '../widgets/outfit_result_card.dart';
import '../widgets/outfit_style_selector.dart';
import '../widgets/saved_outfit_card.dart';

const _minWardrobeItemsForGeneration = 2;

/// The Outfits tab: pick a style, generate a few combinations from the
/// user's own wardrobe, save the ones worth keeping.
class OutfitsScreen extends ConsumerWidget {
  const OutfitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wardrobeItems = ref.watch(wardrobeItemsProvider);

    if (wardrobeItems.length < _minWardrobeItemsForGeneration) {
      return const Scaffold(
        body: SafeArea(
          child: EmptyState(
            icon: Icons.auto_awesome_outlined,
            title: 'Add a few more items first',
            message:
                'Wardro needs at least a couple of wardrobe items to put '
                'an outfit together. Head to the Wardrobe tab to add more.',
          ),
        ),
      );
    }

    final selectedStyle = ref.watch(selectedOutfitStyleProvider);
    final mode = ref.watch(outfitGeneratorModeProvider);
    final generationState = ref.watch(outfitGenerationProvider);
    final itemsById = ref.watch(wardrobeItemsByIdProvider);
    final savedOutfits = ref.watch(savedOutfitsProvider);
    final isLoading = generationState is OutfitGenerationLoading;
    final isQuickMatch = mode == OutfitGeneratorMode.quickMatch;

    List<ClothingItem> resolve(List<String> itemIds) => itemIds
        .map((id) => itemsById[id])
        .whereType<ClothingItem>()
        .toList();

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            SectionHeader(
              title: 'Create an outfit',
              subtitle: isQuickMatch
                  ? 'Free, on-device color matching — any occasion.'
                  : 'Pick an occasion and let Wardro style you.',
            ),
            const SizedBox(height: 16),
            OutfitModeToggle(
              mode: mode,
              onChanged: (newMode) =>
                  ref.read(outfitGeneratorModeProvider.notifier).state = newMode,
            ),
            const SizedBox(height: 16),
            if (!isQuickMatch)
              OutfitStyleSelector(
                selected: selectedStyle,
                onChanged: (style) =>
                    ref.read(selectedOutfitStyleProvider.notifier).state = style,
              ),
            if (!isQuickMatch) const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: isLoading
                  ? null
                  : () => ref
                        .read(outfitGenerationProvider.notifier)
                        .generate(selectedStyle, wardrobeItems),
              icon: isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(isLoading ? 'Styling…' : 'Generate outfits'),
            ),
            const SizedBox(height: 20),
            switch (generationState) {
              OutfitGenerationIdle() => const SizedBox.shrink(),
              OutfitGenerationLoading() => const OutfitGeneratingView(),
              OutfitGenerationError(:final message) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  message,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ),
              OutfitGenerationData(:final outfits) => Column(
                children: [
                  for (final (index, outfit) in outfits.indexed)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child:
                          OutfitResultCard(
                            outfit: outfit,
                            items: resolve(outfit.itemIds),
                            isSaved: savedOutfits.any(
                              (saved) =>
                                  saved.title == outfit.title &&
                                  saved.itemIds.join(',') ==
                                      outfit.itemIds.join(','),
                            ),
                            onSave: () async {
                              final messenger = ScaffoldMessenger.of(context);
                              await ref
                                  .read(savedOutfitsProvider.notifier)
                                  .save(selectedStyle, outfit);
                              showAppSnackBar(messenger, 'Outfit saved');
                            },
                          ).staggeredEntrance(index),
                    ),
                ],
              ),
            },
            const SizedBox(height: 32),
            SectionHeader(
              title: 'Saved outfits',
              subtitle: savedOutfits.isEmpty
                  ? 'Outfits you save will show up here.'
                  : null,
            ),
            const SizedBox(height: 12),
            for (final (index, outfit) in savedOutfits.indexed)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child:
                    SavedOutfitCard(
                      outfit: outfit,
                      items: resolve(outfit.itemIds),
                      onDelete: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        await ref
                            .read(savedOutfitsProvider.notifier)
                            .delete(outfit.id);
                        showAppSnackBar(messenger, 'Outfit removed');
                      },
                    ).staggeredEntrance(index),
              ),
          ],
        ),
      ),
    );
  }
}
