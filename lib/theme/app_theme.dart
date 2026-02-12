import 'package:flutter/material.dart';

/// Thème de l'application ICEM Quality Control
/// Ce fichier contient toutes les couleurs et styles visuels de l'app
class AppTheme {
  // Couleurs principales ICEM (industriel professionnel)
  static const Color primaryBlue = Color(0xFF1565C0); // Bleu industriel
  static const Color secondaryOrange = Color(0xFFFF6F00); // Orange pour alertes
  static const Color successGreen = Color(0xFF2E7D32); // Vert pour succès
  static const Color warningAmber = Color(0xFFF57C00); // Ambre pour avertissements
  static const Color errorRed = Color(0xFFC62828); // Rouge pour erreurs
  
  // Couleurs de fond
  static const Color backgroundLight = Color(0xFFF5F7FA);
  static const Color cardWhite = Color(0xFFFFFFFF);
  static const Color dividerGrey = Color(0xFFE0E0E0);
  
  // Couleurs de texte
  static const Color textDark = Color(0xFF212121);
  static const Color textGrey = Color(0xFF757575);
  static const Color textLight = Color(0xFF9E9E9E);

  /// Thème clair de l'application
  static ThemeData get lightTheme {
    return ThemeData(
      // Utilisation de Material Design 3
      useMaterial3: true,
      
      // Schéma de couleurs
      colorScheme: ColorScheme.light(
        primary: primaryBlue,
        secondary: secondaryOrange,
        surface: cardWhite,
        background: backgroundLight,
        error: errorRed,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textDark,
        onBackground: textDark,
        onError: Colors.white,
      ),
      
      // Barre d'application (AppBar)
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        elevation: 2,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      
      // Cartes

      
      // Boutons élevés
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      
      // Styles de texte
      textTheme: const TextTheme(
        // Grand titre
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textDark,
        ),
        // Titre moyen
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        // Petit titre
        titleLarge: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        // Titre de carte
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: textDark,
        ),
        // Corps de texte
        bodyLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: textDark,
        ),
        // Texte secondaire
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textGrey,
        ),
        // Petit texte
        bodySmall: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: textLight,
        ),
      ),
      
      // Icônes
      iconTheme: const IconThemeData(
        color: primaryBlue,
        size: 24,
      ),
    );
  }
}


