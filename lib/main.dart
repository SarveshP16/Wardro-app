import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/storage/local_storage_service.dart';
import 'features/wardrobe/services/background_removal_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStorageService.init();
  await OnnxBackgroundRemoverInitializer.ensureInitialized();
  runApp(const ProviderScope(child: WardroApp()));
}
