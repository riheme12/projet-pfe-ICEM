import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Widget carte pour afficher un ordre de fabrication — Design Unifié
class OrderCard extends StatelessWidget {
  final ManufacturingOrder order;
  final VoidCallback onTap;

  const OrderCard({super.key, required this.order, required this.onTap});

  Color get _statusColor {
    switch (order.status) {
      case 'En cours': return const Color(0xFF6366F1);
      case 'Terminé': return const Color(0xFF10B981);
      case 'En attente': return const Color(0xFFF59E0B);
      default: return AppTheme.textLight;
    }
  }

  Color get _statusColor2 {
    switch (order.status) {
      case 'En cours': return const Color(0xFF8B5CF6);
      case 'Terminé': return const Color(0xFF059669);
      case 'En attente': return const Color(0xFFD97706);
      default: return AppTheme.textLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _statusColor.withOpacity(0.12)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [_statusColor.withOpacity(0.15), _statusColor.withOpacity(0.05)]),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.assignment_rounded, color: _statusColor, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(order.reference, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.primaryNavy)),
                  Text('Gipros: ${order.gipros}', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey, fontWeight: FontWeight.w600)),
                ])),
                StatusBadge(status: order.status, isSmall: true),
              ]),
              const SizedBox(height: 14),
              // Progress bar
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('${order.inspectedCount}/${order.qta} inspectés', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey, fontWeight: FontWeight.w600)),
                Text('${order.progressPercentage.toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: _statusColor)),
              ]),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: order.progressPercentage / 100,
                  backgroundColor: _statusColor.withOpacity(0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(_statusColor),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 12),
              Row(children: [
                _stat(Icons.check_circle_rounded, '${order.conformCount}', const Color(0xFF10B981)),
                const SizedBox(width: 14),
                _stat(Icons.cancel_rounded, '${order.nonConformCount}', const Color(0xFFF43F5E)),
                const Spacer(),
                if (order.inspectedCount > 0) Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: (order.conformityRate >= 95 ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${order.conformityRate.toStringAsFixed(1)}%',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900,
                        color: order.conformityRate >= 95 ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: AppTheme.surfaceGrey, borderRadius: BorderRadius.circular(8)),
                  child: Icon(Icons.arrow_forward_ios_rounded, size: 12, color: _statusColor),
                ),
              ]),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _stat(IconData icon, String text, Color color) => Row(children: [
    Icon(icon, size: 14, color: color),
    const SizedBox(width: 4),
    Text(text, style: GoogleFonts.inter(fontSize: 11, color: color, fontWeight: FontWeight.w800)),
  ]);
}
