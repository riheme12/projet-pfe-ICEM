import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const lightColorScheme = ColorScheme(
  brightness: Brightness.light,
  primary: Color(0xFF1E3A5F),
  onPrimary: Color(0xFFFFFFFF),
  secondary: Color(0xFF4A90D9),
  onSecondary: Color(0xFFFFFFFF),
  error: Color(0xFFFF1744),
  onError: Color(0xFFFFFFFF),
  shadow: Color(0xFF000000),
  outlineVariant: Color(0xFFE8ECF0),
  surface: Color(0xFFF0F4F8),
  onSurface: Color(0xFF1A2138),
);

const darkColorScheme = ColorScheme(
  brightness: Brightness.dark,
  primary: Color(0xFF4A90D9),
  onPrimary: Color(0xFFFFFFFF),
  secondary: Color(0xFF7BB3F0),
  onSecondary: Color(0xFFFFFFFF),
  error: Color(0xFFFF1744),
  onError: Color(0xFFFFFFFF),
  shadow: Color(0xFF000000),
  outlineVariant: Color(0xFF374151),
  surface: Color(0xFF111827),
  onSurface: Color(0xFFF9FAFB),
);

ThemeData lightMode = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: lightColorScheme,
  textTheme: GoogleFonts.interTextTheme(),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ButtonStyle(
      backgroundColor: WidgetStateProperty.all<Color>(
        lightColorScheme.primary,
      ),
      foregroundColor: WidgetStateProperty.all<Color>(Colors.white),
      elevation: WidgetStateProperty.all<double>(0),
      padding: WidgetStateProperty.all<EdgeInsets>(
          const EdgeInsets.symmetric(horizontal: 28, vertical: 18)),
      shape: WidgetStateProperty.all<RoundedRectangleBorder>(
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
      ),
    ),
  ),
);

ThemeData darkMode = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: darkColorScheme,
  textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
);
