import 'package:flutter/material.dart';

/// Widget réutilisable pour afficher une fonctionnalité
/// 
/// Ce widget crée une belle carte avec:
/// - Une icône colorée
/// - Un titre
/// - Une description
/// - Une action au clic
class FeatureCard extends StatelessWidget {
  // Propriétés du widget (passées lors de la création)
  final IconData icon;           // L'icône à afficher
  final String title;            // Le titre de la fonctionnalité
  final String description;      // La description courte
  final Color color;             // La couleur de l'icône
  final VoidCallback onTap;      // La fonction à exécuter au clic

  // Constructeur : définit comment créer ce widget
  const FeatureCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Card : crée une carte avec ombres et coins arrondis
    return Card(
      // InkWell : rend la carte cliquable avec effet visuel
      child: InkWell(
        onTap: onTap, // Action au clic
        borderRadius: BorderRadius.circular(12), // Coins arrondis pour l'effet
        child: Padding(
          padding: const EdgeInsets.all(16.0), // Espacement interne
          // Column : aligne les enfants verticalement
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, // Alignement à gauche
            children: [
              // Ligne avec l'icône
              Row(
                children: [
                  // Container avec fond circulaire pour l'icône
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1), // Fond avec transparence
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      icon,
                      color: color,
                      size: 32,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16), // Espacement vertical
              
              // Titre de la fonctionnalité
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              
              // Description
              Text(
                description,
                style: Theme.of(context).textTheme.bodyMedium,
                maxLines: 2, // Maximum 2 lignes
                overflow: TextOverflow.ellipsis, // "..." si trop long
              ),
              
              const SizedBox(height: 12),
              
              // Flèche pour indiquer que c'est cliquable
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(
                    Icons.arrow_forward,
                    color: color,
                    size: 20,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
