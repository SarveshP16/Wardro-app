import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/theme/app_motion.dart';

/// The first step of the add-item flow: choose whether the new photo
/// comes from the camera or the gallery.
class AddItemSourcePicker extends StatelessWidget {
  const AddItemSourcePicker({
    super.key,
    required this.onPickCamera,
    required this.onPickGallery,
  });

  final VoidCallback onPickCamera;
  final VoidCallback onPickGallery;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.auto_awesome_outlined,
            size: 56,
            color: theme.colorScheme.primary,
          ).animate().fadeIn(duration: AppMotion.slow).scale(
            begin: const Offset(0.8, 0.8),
            end: const Offset(1, 1),
          ),
          const SizedBox(height: 20),
          Text(
            'Add a wardrobe item',
            style: theme.textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Lay the item flat or on a hanger, take one photo, and '
            "Wardro will lift it out of the background — clean product "
            'shots, automatically.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          FilledButton.icon(
            onPressed: onPickCamera,
            icon: const Icon(Icons.photo_camera_outlined),
            label: const Text('Take a photo'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onPickGallery,
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('Choose from gallery'),
          ),
        ],
      ),
    );
  }
}
