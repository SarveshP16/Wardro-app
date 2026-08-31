import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';

import '../../../../core/storage/image_file_store.dart';
import '../../../../core/widgets/app_snackbar.dart';
import '../../application/wardrobe_providers.dart';
import '../../domain/clothing_category.dart';
import '../../domain/clothing_item.dart';
import '../../services/background_removal_service.dart';
import '../../services/dominant_color_extractor.dart';
import '../widgets/add_item_preview_form.dart';
import '../widgets/add_item_processing_view.dart';
import '../widgets/add_item_source_picker.dart';

enum _AddItemStep { pickSource, processing, preview }

/// Drives the full add-item flow: pick a photo → run on-device background
/// removal → confirm category/name → save. Each visual step lives in its
/// own widget under `presentation/widgets/`; this screen just holds the
/// flow state and wires them together.
class AddItemScreen extends ConsumerStatefulWidget {
  const AddItemScreen({super.key});

  @override
  ConsumerState<AddItemScreen> createState() => _AddItemScreenState();
}

class _AddItemScreenState extends ConsumerState<AddItemScreen> {
  final _picker = ImagePicker();
  final _nameController = TextEditingController();
  final _uuid = const Uuid();

  _AddItemStep _step = _AddItemStep.pickSource;
  Uint8List? _processedBytes;
  ClothingCategory _category = ClothingCategory.top;
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 95);
    if (picked == null || !mounted) return;

    setState(() => _step = _AddItemStep.processing);
    try {
      final service = ref.read(backgroundRemovalServiceProvider);
      final bytes = await service.removeBackground(picked.path);
      if (!mounted) return;
      setState(() {
        _processedBytes = bytes;
        _step = _AddItemStep.preview;
      });
    } on BackgroundRemovalException catch (e) {
      if (!mounted) return;
      showAppSnackBar(ScaffoldMessenger.of(context), e.message);
      setState(() => _step = _AddItemStep.pickSource);
    }
  }

  Future<void> _save() async {
    final bytes = _processedBytes;
    if (bytes == null) return;

    setState(() => _isSaving = true);
    final id = _uuid.v4();
    final imagePath = await ImageFileStore.save(id: id, bytes: bytes);
    final dominantColor = await DominantColorExtractor.extract(bytes);
    final item = ClothingItem(
      id: id,
      category: _category,
      imagePath: imagePath,
      createdAt: DateTime.now(),
      name: _nameController.text.trim().isEmpty
          ? null
          : _nameController.text.trim(),
      dominantColor: dominantColor,
    );
    await ref.read(wardrobeItemsProvider.notifier).add(item);

    if (!mounted) return;
    showAppSnackBar(ScaffoldMessenger.of(context), 'Added to your wardrobe');
    Navigator.of(context).pop();
  }

  void _retake() {
    setState(() {
      _processedBytes = null;
      _step = _AddItemStep.pickSource;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add item')),
      body: SafeArea(
        child: switch (_step) {
          _AddItemStep.pickSource => AddItemSourcePicker(
            onPickCamera: () => _pickImage(ImageSource.camera),
            onPickGallery: () => _pickImage(ImageSource.gallery),
          ),
          _AddItemStep.processing => const AddItemProcessingView(),
          _AddItemStep.preview => AddItemPreviewForm(
            imageBytes: _processedBytes!,
            category: _category,
            onCategoryChanged: (c) => setState(() => _category = c),
            nameController: _nameController,
            onRetake: _retake,
            onSave: _save,
            isSaving: _isSaving,
          ),
        },
      ),
    );
  }
}
