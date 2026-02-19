import 'package:flutter/material.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Widget carte pour afficher un ordre de fabrication
/// 
/// Affiche les informations principales d'un ordre :
/// - Référence et type de câble
/// - Progression
/// - Statut
/// - Taux de conformité
class OrderCard extends StatelessWidget {
  final manufacturingOrder order;
  final VoidCallback onTap;

  const OrderCard({
    super.key,
    required this.order,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // En-tête : Référence et statut
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Référence
                  Text(
                    order.reference,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryBlue,
                        ),
                  ),
                  // Badge de statut
                  StatusBadge(status: order.status, isSmall: true),
                ],
              ),
              const SizedBox(height: 8),

              // Gipros (anciennement type de câble)
              Text(
                'Gi pros: ${order.Gipros}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),

              // Progression
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Texte de progression
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${order.inspectedCount} / ${order.QTA} inspectés',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            Text(
                              '${order.progressPercentage.toStringAsFixed(0)}%',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        // Barre de progression
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: order.progressPercentage / 100,
                            backgroundColor: AppTheme.dividerGrey,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              order.status == 'Terminé'
                                  ? AppTheme.successGreen
                                  : AppTheme.primaryBlue,
                            ),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Statistiques
              Row(
                children: [
                  // Conformes
                  _buildStatItem(
                    context,
                    Icons.check_circle_outline,
                    '${order.conformCount} conformes',
                    AppTheme.successGreen,
                  ),
                  const SizedBox(width: 16),
                  // Non conformes
                  _buildStatItem(
                    context,
                    Icons.warning_amber_outlined,
                    '${order.nonConformCount} défauts',
                    AppTheme.errorRed,
                  ),
                  const Spacer(),
                  // Taux de conformité
                  if (order.inspectedCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: order.conformityRate >= 95
                            ? AppTheme.successGreen.withValues(alpha: 0.1)
                            : AppTheme.warningAmber.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${order.conformityRate.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: order.conformityRate >= 95
                              ? AppTheme.successGreen
                              : AppTheme.warningAmber,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Widget pour afficher une petite statistique
  Widget _buildStatItem(
    BuildContext context,
    IconData icon,
    String text,
    Color color,
  ) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          text,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: color,
              ),
        ),
      ],
    );
  }
}
