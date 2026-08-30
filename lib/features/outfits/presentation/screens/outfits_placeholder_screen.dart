import 'package:flutter/material.dart';

import '../../../../core/widgets/empty_state.dart';

/// Placeholder for the outfit-generation tab. Real generation (style
/// prompts → an LLM call → suggested combos, per project memory) lands
/// once the wardrobe feature is solid — this just reserves the app-shell
/// slot so the bottom nav shape is already in place.
class OutfitsPlaceholderScreen extends StatelessWidget {
  const OutfitsPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: EmptyState(
          icon: Icons.auto_awesome_outlined,
          title: 'Outfit generation is coming soon',
          message:
              'Once your wardrobe has a few items in it, Wardro will be '
              'able to put together full outfits for any occasion.',
        ),
      ),
    );
  }
}
