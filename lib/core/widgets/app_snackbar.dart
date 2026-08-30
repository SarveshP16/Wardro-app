import 'package:flutter/material.dart';

/// Shows a [SnackBar] after clearing any currently-visible one, so rapid
/// actions (e.g. deleting several wardrobe items in a row) never queue up
/// toasts that outlive the action that triggered them.
void showAppSnackBar(
  ScaffoldMessengerState messenger,
  String message, {
  SnackBarAction? action,
}) {
  messenger.removeCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(content: Text(message), action: action),
  );
}
