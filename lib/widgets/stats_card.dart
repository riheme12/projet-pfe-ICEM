import 'package:flutter/material.dart';

/// Widget pour afficher une statistique
/// 
/// Affiche un nombre avec une icône et un label
/// Exemple: "24" avec icône et label "Ordres en cours"
class StatsCard extends StatelessWidget {
  final String value;       // La valeur à afficher (ex: "24")
  final String label;       // Le label explicatif
  final IconData icon;      // L'icône
  final Color color;        // La couleur

  const StatsCard({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        // Column : empile les éléments verticalement
        child: Column(
          mainAxisSize: MainAxisSize.min, // Prend le minimum de place
          children: [
            // Icône avec fond circulaire
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(height: 12),
            
            // La valeur (grand nombre)
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            
            // Le label (petit texte)
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
