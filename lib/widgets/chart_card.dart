import 'package:flutter/material.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Widget carte pour afficher un graphique
/// 
/// Pour l'instant affiche un placeholder
/// Sera remplacé par de vrais graphiques plus tard
class ChartCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  final double? height;

  const ChartCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Titre
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 4),
            // Sous-titre
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textGrey,
                  ),
            ),
            const SizedBox(height: 16),
            // Contenu du graphique
            SizedBox(
              height: height ?? 200,
              child: child,
            ),
          ],
        ),
      ),
    );
  }
}

/// Widget placeholder pour un graphique
/// 
/// Affiche un message temporaire en attendant les vrais graphiques
class ChartPlaceholder extends StatelessWidget {
  final String message;
  final IconData icon;

  const ChartPlaceholder({
    super.key,
    required this.message,
    this.icon = Icons.bar_chart,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppTheme.dividerGrey,
          style: BorderStyle.solid,
          width: 2,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 48,
              color: AppTheme.textLight,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textGrey,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
