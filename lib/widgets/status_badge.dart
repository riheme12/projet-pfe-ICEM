import 'package:flutter/material.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Widget badge pour afficher un statut — style Material 3
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
    final _BadgeStyle style = _resolveStyle(status);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSmall ? 10 : 14,
        vertical: isSmall ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: style.bgColor,
        borderRadius: BorderRadius.circular(isSmall ? 20 : 20),
        border: Border.all(
          color: style.borderColor,
          width: 1,
        ),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: style.textColor,
          fontSize: isSmall ? 11 : 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  _BadgeStyle _resolveStyle(String status) {
    switch (status) {
      case 'En cours':
        return _BadgeStyle(
          bgColor: AppTheme.accentBlue.withValues(alpha: 0.12),
          textColor: AppTheme.accentBlue,
          borderColor: AppTheme.accentBlue.withValues(alpha: 0.3),
        );
      case 'Terminé':
      case 'Conforme':
        return _BadgeStyle(
          bgColor: AppTheme.successGreen.withValues(alpha: 0.12),
          textColor: const Color(0xFF00A040),
          borderColor: AppTheme.successGreen.withValues(alpha: 0.3),
        );
      case 'En attente':
        return _BadgeStyle(
          bgColor: AppTheme.warningAmber.withValues(alpha: 0.12),
          textColor: const Color(0xFFB07800),
          borderColor: AppTheme.warningAmber.withValues(alpha: 0.3),
        );
      case 'Non conforme':
        return _BadgeStyle(
          bgColor: AppTheme.errorRed.withValues(alpha: 0.1),
          textColor: AppTheme.errorRed,
          borderColor: AppTheme.errorRed.withValues(alpha: 0.3),
        );
      case 'Critique':
        return _BadgeStyle(
          bgColor: AppTheme.errorRed.withValues(alpha: 0.1),
          textColor: AppTheme.errorRed,
          borderColor: AppTheme.errorRed.withValues(alpha: 0.3),
        );
      case 'Majeur':
        return _BadgeStyle(
          bgColor: AppTheme.secondaryOrange.withValues(alpha: 0.12),
          textColor: const Color(0xFFCC4400),
          borderColor: AppTheme.secondaryOrange.withValues(alpha: 0.3),
        );
      case 'Mineur':
        return _BadgeStyle(
          bgColor: const Color(0xFFFFF8E1),
          textColor: const Color(0xFF996600),
          borderColor: const Color(0xFFFFD54F),
        );
      default:
        return _BadgeStyle(
          bgColor: AppTheme.textLight.withValues(alpha: 0.15),
          textColor: AppTheme.textGrey,
          borderColor: AppTheme.dividerGrey,
        );
    }
  }
}

class _BadgeStyle {
  final Color bgColor;
  final Color textColor;
  final Color borderColor;
  const _BadgeStyle({
    required this.bgColor,
    required this.textColor,
    required this.borderColor,
  });
}
