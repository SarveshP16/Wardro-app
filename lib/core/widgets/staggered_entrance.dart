import 'package:flutter/widgets.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_motion.dart';

/// Fade + slide-in entrance for grid/list items, staggered by [index] so
/// items cascade in rather than popping in all at once. Used across the
/// wardrobe grid and (later) outfit result cards for a consistent feel.
extension StaggeredEntrance on Widget {
  Widget staggeredEntrance(int index) {
    return animate(delay: AppMotion.staggerStep * index)
        .fadeIn(duration: AppMotion.medium, curve: AppMotion.entranceCurve)
        .slideY(
          begin: 0.08,
          end: 0,
          duration: AppMotion.medium,
          curve: AppMotion.entranceCurve,
        );
  }
}
