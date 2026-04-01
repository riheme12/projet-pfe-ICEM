import 'package:flutter/material.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Widget carte pour afficher un ordre de fabrication
class OrderCard extends StatelessWidget {
  final ManufacturingOrder order;
  final VoidCallback onTap;

  const OrderCard({
    super.key,
    required this.order,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color statusColor = _getStatusColor();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE8ECF0),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: statusColor.withValues(alpha: 0.10),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Material(
          color: Colors.white,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Row(
              children: [
                // Colored status indicator bar
                Container(
                  width: 4,
                  height: 160, // Fixed height or auto-expanding height
                  color: statusColor,
                ),
                Expanded(
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
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primaryBlue,
                              ),
                            ),
                            // Badge de statut
                            StatusBadge(status: order.status, isSmall: true),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Gipros
                        Text(
                          'Gi pros: ${order.Gipros}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppTheme.textGrey,
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Progression
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${order.inspectedCount} / ${order.QTA} inspectés',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textGrey,
                                  ),
                                ),
                                Text(
                                  '${order.progressPercentage.toStringAsFixed(0)}%',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
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
                        const SizedBox(height: 12),

                        // Statistiques
                        Row(
                          children: [
                            _buildStatItem(
                              Icons.check_circle_outline,
                              '${order.conformCount} conformes',
                              AppTheme.successGreen,
                            ),
                            const SizedBox(width: 16),
                            _buildStatItem(
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
                                      ? AppTheme.successGreen.withValues(alpha: 0.12)
                                      : AppTheme.warningAmber.withValues(alpha: 0.12),
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
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (order.status) {
      case 'En cours':
        return AppTheme.accentBlue;
      case 'Terminé':
        return AppTheme.successGreen;
      case 'En attente':
        return AppTheme.warningAmber;
      default:
        return AppTheme.textLight;
    }
  }

  Widget _buildStatItem(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: color,
          ),
        ),
      ],
    );
  }
}
