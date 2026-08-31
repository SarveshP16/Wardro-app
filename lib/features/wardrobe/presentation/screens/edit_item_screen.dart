import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_snackbar.dart';
import '../../application/wardrobe_providers.dart';
import '../../domain/clothing_category.dart';
import '../../domain/clothing_item.dart';
import '../widgets/add_item_category_selector.dart';

/// Lets the user fix a wardrobe item's category or name after the fact —
/// the photo itself isn't editable here (see project memory for why that
/// was scoped out of v1).
class EditItemScreen extends ConsumerStatefulWidget {
  const EditItemScreen({super.key, required this.item});

  final ClothingItem item;

  @override
  ConsumerState<EditItemScreen> createState() => _EditItemScreenState();
}

class _EditItemScreenState extends ConsumerState<EditItemScreen> {
  late ClothingCategory _category = widget.item.category;
  late final _nameController = TextEditingController(text: widget.item.name);
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    final updated = widget.item.copyWith(
      category: _category,
      name: _nameController.text.trim().isEmpty
          ? null
          : _nameController.text.trim(),
    );
    await ref.read(wardrobeItemsProvider.notifier).update(updated);

    if (!mounted) return;
    showAppSnackBar(ScaffoldMessenger.of(context), 'Item updated');
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Edit item')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Container(
              height: 220,
              decoration: BoxDecoration(
                color: AppColors.photoBackdrop,
                borderRadius: BorderRadius.circular(24),
              ),
              padding: const EdgeInsets.all(20),
              child: Image.file(File(widget.item.imagePath), fit: BoxFit.contain),
            ),
            const SizedBox(height: 24),
            Text('Category', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            AddItemCategorySelector(
              selected: _category,
              onChanged: (category) => setState(() => _category = category),
            ),
            const SizedBox(height: 24),
            Text('Name (optional)', style: theme.textTheme.titleMedium),
            const SizedBox(height: 10),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                hintText: 'e.g. Blue denim jacket',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: _isSaving ? null : _save,
              icon: _isSaving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check),
              label: Text(_isSaving ? 'Saving…' : 'Save changes'),
            ),
          ],
        ),
      ),
    );
  }
}
