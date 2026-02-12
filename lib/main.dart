// Point d'entrée de l'application Flutter
// Ce fichier est le premier à s'exécuter quand l'app démarre

import 'package:flutter/material.dart';
import 'package:projeticem/screens/home_page.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Fonction main() : point de départ de l'application
/// Elle lance l'application Flutter
void main() {
  runApp(const ICEMQualityApp());
}

/// Widget principal de l'application
/// C'est un StatelessWidget car il ne change pas après sa création
class ICEMQualityApp extends StatelessWidget {
  const ICEMQualityApp({super.key});

  @override
  Widget build(BuildContext context) {
    // MaterialApp : widget racine de toute application Flutter
    // Il configure les routes, le thème, le titre, etc.
    return MaterialApp(
      // Titre de l'application (visible dans le gestionnaire de tâches)
      title: 'ICEM Quality Control',
      
      // Thème visuel de l'application (couleurs, styles, etc.)
      theme: AppTheme.lightTheme,
      
      // Désactive la bannière "Debug" en haut à droite
      debugShowCheckedModeBanner: false,
      
      // Page d'accueil de l'application
      // C'est la première page affichée au démarrage
      home: const HomePage(),
    );
  }
}
