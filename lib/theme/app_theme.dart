import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Thème Corporate Hybrid ICEM (Optimisé pour Lisibilité Mobile & Contraste)
class AppTheme {
  // ─── Palette Corporate ──────────────────────────────────────────────────
  static const Color primaryNavy = Color(0xFF0F172A); 
  static const Color accentBlue = Color(0xFF2563EB);  
  static const Color surfaceGrey = Color(0xFFF8FAFC); 
  static const Color successGreen = Color(0xFF10B981);
  static const Color warningAmber = Color(0xFFF59E0B);
  static const Color errorRed = Color(0xFFEF4444);
  static const Color infoBlue = Color(0xFF3B82F6);
  static const Color borderGris = Color(0xFFE2E8F0);

  // ─── Aliases & Compatibilité ─────────────────────────────────────────────
  static const Color primaryBlue = infoBlue; 
  static const Color border = borderGris;
  static const Color background = surfaceGrey;
  static const Color surface = Colors.white;
  static const Color divider = Color(0xFFF1F5F9);
  static const Color darkBg = Colors.white; 
  static const Color darkSurface = Color(0xFFF1F5F9);
  static const Color darkCard = Colors.white;
  static const Color darkBorder = borderGris;
  static const Color glassBg = Color(0x0A000000); 
  static const Color glassBorder = borderGris;
  static const Color textDark = Color(0xFF1E293B);
  static const Color textGrey = Color(0xFF64748B);
  static const Color textLight = Color(0xFF94A3B8);
  static const Color secondaryOrange = warningAmber;
  static const Color accentCyan = Color(0xFF06B6D4);

  // ─── Gradients ────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF2563EB)],
    begin: Alignment.centerLeft, end: Alignment.centerRight,
  );

  static const LinearGradient cyanGradient = accentGradient;
  static const LinearGradient warmGradient = LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]);
  static const LinearGradient successGradient = LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]);

  // ─── Décorations ──────────────────────────────────────────────────────────
  static BoxDecoration cardDecoration({double radius = 12, bool hasShadow = true}) => BoxDecoration(
    color: Colors.white, borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: borderGris, width: 1),
    boxShadow: hasShadow ? [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))] : null,
  );

  static BoxDecoration darkCardDecoration({double radius = 12}) => cardDecoration(radius: radius);

  static BoxDecoration glassCard({double radius = 12, Color? borderColor}) => BoxDecoration(
    color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: borderColor ?? borderGris.withOpacity(0.4), width: 1),
  );

  // ─── Thèmes ─────────────────────────────────────────────────────────────
  static ThemeData get lightTheme => _baseTheme();
  static ThemeData get darkTheme => _baseTheme(); 

  static ThemeData _baseTheme() {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: surfaceGrey,
      colorScheme: ColorScheme.light(
        primary: primaryNavy, secondary: accentBlue, surface: Colors.white, error: errorRed,
      ),
      textTheme: TextTheme(
        headlineLarge: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: textDark),
        headlineMedium: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: textDark),
        titleLarge: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: textDark),
        bodyLarge: GoogleFonts.inter(fontSize: 16, color: textDark, fontWeight: FontWeight.w500),
        bodyMedium: GoogleFonts.inter(fontSize: 14, color: textGrey),
        labelLarge: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: textGrey),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white, elevation: 0, centerTitle: true,
        iconTheme: const IconThemeData(color: textDark),
        titleTextStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800, color: textDark),
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: borderGris)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: borderGris)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: accentBlue, width: 2)),
        hintStyle: GoogleFonts.inter(color: textLight, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryNavy, foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14),
          elevation: 0,
        ),
      ),
    );
  }
}
