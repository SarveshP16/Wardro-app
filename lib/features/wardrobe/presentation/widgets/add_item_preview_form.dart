import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_motion.dart';
import '../../domain/clothing_category.dart';
import 'add_item_category_selector.dart';

/// Final step of the add-item flow: shows the background-removed cutout,
/// lets the user confirm the category and optionally name the item, then
/// save or retake the photo.
class AddItemPreviewForm extends StatelessWidget {
  const AddItemPreviewForm({
    super.key,
    required this.imageBytes,
    required this.category,
    required this.onCategoryChanged,
    required this.nameController,
    required this.onRetake,
    required this.onSave,
    required this.isSaving,
  });

  final Uint8List imageBytes;
  final ClothingCategory category;
  final ValueChanged<ClothingCategory> onCategoryChanged;
  final TextEditingController nameController;
  final VoidCallback onRetake;
  final VoidCallback onSave;
  final bool isSaving;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      children: [
        Container(
          height: 280,
          decoration: BoxDecoration(
            color: AppColors.photoBackdrop,
            borderRadius: BorderRadius.circular(24),
          ),
          padding: const EdgeInsets.all(20),
          child: Image.memory(imageBytes, fit: BoxFit.contain),
        ).animate().fadeIn(duration: AppMotion.medium).slideY(begin: 0.05, end: 0),
        const SizedBox(height: 24),
        Text('Category', style: theme.textTheme.titleMedium),
        const SizedBox(height: 10),
        AddItemCategorySelector(selected: category, onChanged: onCategoryChanged),
        const SizedBox(height: 24),
        Text('Name (optional)', style: theme.textTheme.titleMedium),
        const SizedBox(height: 10),
        TextField(
          controller: nameController,
          decoration: const InputDecoration(
            hintText: 'e.g. Blue denim jacket',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(14)),
            ),
          ),
        ),
        const SizedBox(height: 32),
        FilledButton.icon(
          onPressed: isSaving ? null : onSave,
          icon: isSaving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Icon(Icons.check),
          label: Text(isSaving ? 'Saving…' : 'Save to wardrobe'),
        ),
        const SizedBox(height: 8),
        TextButton.icon(
          onPressed: isSaving ? null : onRetake,
          icon: const Icon(Icons.replay_outlined),
          label: const Text('Retake photo'),
        ),
      ],
    );
  }
}
