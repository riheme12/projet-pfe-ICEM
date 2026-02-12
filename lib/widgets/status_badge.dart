import 'package:flutter/material.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Widget badge pour afficher un statut
/// 
/// Affiche un badge coloré avec du texte
/// Utilisé pour les statuts d'ordres, câbles, conformité, etc.
class StatusBadge extends StatelessWidget {
  final String status;
  final bool isSmall;

  const StatusBadge({
    super.key,
    required this.status,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    // Déterminer la couleur selon le statut
    Color backgroundColor;
    Color textColor = Colors.white;

    switch (status) {
      case 'En cours':
        backgroundColor = AppTheme.primaryBlue;
        break;
      case 'Terminé':
      case 'Conforme':
        backgroundColor = AppTheme.successGreen;
        break;
      case 'En attente':
        backgroundColor = AppTheme.warningAmber;
        break;
      case 'Non conforme':
        backgroundColor = AppTheme.errorRed;
        break;
      case 'Critique':
        backgroundColor = AppTheme.errorRed;
        break;
      case 'Majeur':
        backgroundColor = AppTheme.secondaryOrange;
        break;
      case 'Mineur':
        backgroundColor = Colors.amber;
        break;
      default:
        backgroundColor = AppTheme.textGrey;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSmall ? 8 : 12,
        vertical: isSmall ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(isSmall ? 12 : 16),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: textColor,
          fontSize: isSmall ? 11 : 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
