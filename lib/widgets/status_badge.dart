import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Badge de statut avec style adaptatif — Dark Premium
class StatusBadge extends StatelessWidget {
  final String status;
  final bool isSmall;

  const StatusBadge({super.key, required this.status, this.isSmall = false});

  Color get _color {
    switch (status.toLowerCase()) {
      case 'conforme': case 'terminé': return const Color(0xFF10B981);
      case 'non conforme': return const Color(0xFFE53935);
      case 'en cours': return const Color(0xFF4A90D9);
      case 'en attente': return const Color(0xFFFFAB00);
      default: return const Color(0xFF6B7280);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isSmall ? 8 : 12, vertical: isSmall ? 3 : 5),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(isSmall ? 8 : 12),
        border: Border.all(color: _color.withValues(alpha: 0.4), width: 0.5),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontSize: isSmall ? 10 : 12,
          fontWeight: FontWeight.w700,
          color: _color,
        ),
      ),
    );
  }
}
