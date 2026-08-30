import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Wardro's font pairing: Fraunces (a warm, slightly quirky serif) for
/// headings and brand moments, Manrope (a clean geometric sans) for body
/// copy and UI chrome. The pairing is what gives the app a
/// magazine/lookbook personality instead of a default Material feel.
class AppTypography {
  AppTypography._();

  static TextTheme textTheme(Color ink) {
    final base = TextTheme(
      displayLarge: GoogleFonts.fraunces(
        fontSize: 40,
        fontWeight: FontWeight.w600,
        height: 1.1,
        letterSpacing: -0.5,
      ),
      headlineMedium: GoogleFonts.fraunces(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        height: 1.2,
      ),
      titleLarge: GoogleFonts.fraunces(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        height: 1.25,
      ),
      titleMedium: GoogleFonts.manrope(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        height: 1.3,
      ),
      bodyLarge: GoogleFonts.manrope(fontSize: 16, height: 1.4),
      bodyMedium: GoogleFonts.manrope(fontSize: 14, height: 1.4),
      labelLarge: GoogleFonts.manrope(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      ),
      labelMedium: GoogleFonts.manrope(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.4,
      ),
    );
    return base.apply(bodyColor: ink, displayColor: ink);
  }
}
