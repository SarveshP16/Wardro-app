import 'package:flutter/animation.dart';

/// Shared animation durations/curves so motion feels consistent across
/// the app instead of every screen inventing its own timing.
class AppMotion {
  AppMotion._();

  static const fast = Duration(milliseconds: 160);
  static const medium = Duration(milliseconds: 320);
  static const slow = Duration(milliseconds: 520);

  static const entranceCurve = Curves.easeOutCubic;
  static const tapCurve = Curves.easeOut;

  /// Per-item delay step used by grid/list staggered entrances — see
  /// [StaggeredEntrance] in `core/widgets/staggered_entrance.dart`.
  static const staggerStep = Duration(milliseconds: 45);
}
