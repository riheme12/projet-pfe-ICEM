import 'package:flutter/material.dart';
import 'package:projeticem/widgets/feature_card.dart';
import 'package:projeticem/widgets/stats_card.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/profile_page.dart';
import 'package:projeticem/screens/orders_list_page.dart';
import 'package:projeticem/screens/reports_page.dart';
import 'package:projeticem/screens/inspection_page.dart';
import 'package:projeticem/screens/anomalies_list_page.dart';

/// Page d'accueil de l'application ICEM Quality Control
/// 
/// C'est la première page affichée après le login
/// Elle montre les statistiques et donne accès aux fonctionnalités principales
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // Scaffold : structure de base d'une page Flutter
    // Il contient l'AppBar (barre du haut), le body (contenu), etc.
    return Scaffold(
      // AppBar : barre en haut de l'écran
      appBar: AppBar(
        title: const Text('ICEM Quality Control'),
        actions: [
          // Bouton notifications (à droite)
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Ouvrir les notifications
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications - À venir')),
              );
            },
          ),
          // Bouton profil
          IconButton(
            icon: const Icon(Icons.account_circle_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfilePage()),
              );
            },
          ),
        ],
      ),
      
      // Body : contenu principal de la page
      // SingleChildScrollView : permet de faire défiler si le contenu est trop long
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          // Column : empile tous les éléments verticalement
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, // Aligner à gauche
            children: [
              // ============ SECTION BIENVENUE ============
              _buildWelcomeSection(context),
              const SizedBox(height: 24),
              
              // ============ SECTION STATISTIQUES ============
              _buildStatsSection(context),
              const SizedBox(height: 24),
              
              // ============ SECTION FONCTIONNALITÉS ============
              _buildFeaturesSection(context),
            ],
          ),
        ),
      ),
      
      // Bottom Navigation Bar : barre de navigation en bas
      // (Préparation pour plus tard)
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0, // Premier onglet sélectionné
        type: BottomNavigationBarType.fixed, // Tous les onglets visibles
        selectedItemColor: AppTheme.primaryBlue,
        unselectedItemColor: AppTheme.textGrey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Accueil',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt),
            label: 'Inspection',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Historique',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
        onTap: (index) {
          // Navigation entre les pages
          switch (index) {
            case 0:
              // Déjà sur la page d'accueil
              break;
            case 1:
              // Inspection caméra
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const InspectionPage()),
              );
              break;
            case 2:
              // Historique = Ordres de fabrication
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const OrdersListPage()),
              );
              break;
            case 3:
              // Profil
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfilePage()),
              );
              break;
          }
        },
      ),
    );
  }

  /// Construit la section de bienvenue
  Widget _buildWelcomeSection(BuildContext context) {
    // Obtenir la date actuelle
    final now = DateTime.now();
    final dateStr = '${now.day}/${now.month}/${now.year}';
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryBlue, AppTheme.primaryBlue.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryBlue.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icône et date
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Icon(Icons.wb_sunny_outlined, color: Colors.white, size: 32),
              Text(
                dateStr,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Message de bienvenue
          const Text(
            'Bonjour, Technicien!',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Prêt pour les contrôles qualité',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  /// Construit la section statistiques
  Widget _buildStatsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Titre de la section
        Text(
          'Vue d\'ensemble',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 16),
        
        // Grille de 2x2 pour les statistiques
        GridView.count(
          shrinkWrap: true, // Ne prend que l'espace nécessaire
          physics: const NeverScrollableScrollPhysics(), // Pas de scroll interne
          crossAxisCount: 2, // 2 colonnes
          mainAxisSpacing: 12, // Espacement vertical
          crossAxisSpacing: 12, // Espacement horizontal
          childAspectRatio: 1.2, // Ratio largeur/hauteur
          children: [
            // Stat 1 : Ordres en cours
            StatsCard(
              value: '24',
              label: 'Ordres en cours',
              icon: Icons.assignment,
              color: AppTheme.primaryBlue,
            ),
            // Stat 2 : Contrôles aujourd'hui
            StatsCard(
              value: '8',
              label: 'Contrôles effectués',
              icon: Icons.check_circle,
              color: AppTheme.successGreen,
            ),
            // Stat 3 : Anomalies
            StatsCard(
              value: '3',
              label: 'Anomalies détectées',
              icon: Icons.warning,
              color: AppTheme.warningAmber,
            ),
            // Stat 4 : Taux de conformité
            StatsCard(
              value: '96%',
              label: 'Taux de conformité',
              icon: Icons.trending_up,
              color: AppTheme.successGreen,
            ),
          ],
        ),
      ],
    );
  }

  /// Construit la section fonctionnalités
  Widget _buildFeaturesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Titre de la section
        Text(
          'Fonctionnalités',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 16),
        
        // Fonctionnalité 1 : Ordres de fabrication
        FeatureCard(
          icon: Icons.assignment_outlined,
          title: 'Ordres de fabrication',
          description: 'Consulter et gérer les ordres de fabrication',
          color: AppTheme.primaryBlue,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const OrdersListPage()),
            );
          },
        ),
        const SizedBox(height: 12),
        
        // Fonctionnalité 2 : Inspection caméra
        FeatureCard(
          icon: Icons.camera_alt_outlined,
          title: 'Inspection par caméra',
          description: 'Lancer l\'inspection automatique avec IA',
          color: AppTheme.secondaryOrange,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const InspectionPage()),
            );
          },
        ),
        const SizedBox(height: 12),
        
        // Fonctionnalité 3 : Gestion des anomalies
        FeatureCard(
          icon: Icons.warning_amber_outlined,
          title: 'Gestion des anomalies',
          description: 'Consulter et traiter les anomalies détectées',
          color: AppTheme.warningAmber,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AnomaliesListPage()),
            );
          },
        ),
        const SizedBox(height: 12),
        
        // Fonctionnalité 4 : Rapports
        FeatureCard(
          icon: Icons.bar_chart_outlined,
          title: 'Rapports et statistiques',
          description: 'Générer et consulter les rapports qualité',
          color: AppTheme.successGreen,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ReportsPage()),
            );
          },
        ),
      ],
    );
  }
}
