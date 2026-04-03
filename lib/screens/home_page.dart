import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/widgets/feature_card.dart';
import 'package:projeticem/widgets/stats_card.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:provider/provider.dart';
import 'package:projeticem/screens/profile_page.dart';
import 'package:projeticem/screens/orders_list_page.dart';
import 'package:projeticem/screens/reports_page.dart';
import 'package:projeticem/screens/inspection_page.dart';
import 'package:projeticem/screens/anomalies_list_page.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

/// Page d'accueil de l'application ICEM Quality Control
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final OrdersService _ordersService = OrdersService();
  final ReportsService _reportsService = ReportsService();

  int _ordresEnCours = 0;
  int _controlesEffectues = 0;
  int _anomaliesDetectees = 0;
  double _tauxConformite = 0.0;
  bool _statsLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final orders = await _ordersService.getAllOrders();
      final globalStats = await _reportsService.getGlobalStats();
      
      int enCours = 0;
      int totalInspected = 0;
      int totalConform = 0;

      for (var order in orders) {
        if (order.status.toLowerCase() == 'en cours') enCours++;
        totalInspected += order.inspectedCount;
        totalConform += order.conformCount;
      }

      if (mounted) {
        setState(() {
          _ordresEnCours = enCours;
          _controlesEffectues = totalInspected;
          _anomaliesDetectees = globalStats.totalAnomalies;
          _tauxConformite = totalInspected > 0 
              ? (totalConform / totalInspected) * 100 
              : 0.0;
          _statsLoading = false;
        });
      }
    } catch (e) {
      print('Error loading home stats: $e');
      if (mounted) {
        setState(() => _statsLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: CustomScrollView(
        slivers: [
          // Gradient SliverAppBar
          SliverAppBar(
            expandedHeight: 220,
            floating: false,
            pinned: true,
            automaticallyImplyLeading: false,
            backgroundColor: AppTheme.primaryBlue,
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: const BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Top row: logo + title + actions
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Image.asset(
                                  'assets/images/logo.png',
                                  height: 32,
                                  fit: BoxFit.contain,
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  'ICEM Quality',
                                  style: GoogleFonts.inter(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                _buildAppBarIcon(
                                  Icons.notifications_outlined,
                                  () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content:
                                            const Text('Notifications — À venir'),
                                        behavior: SnackBarBehavior.floating,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                const SizedBox(width: 8),
                                _buildAppBarIcon(
                                  Icons.person_outline_rounded,
                                  () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            const ProfilePage(),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Spacer(),
                        // Welcome section
                        _buildWelcomeContent(context),
                      ],
                    ),
                  ),
                ),
              ),
<<<<<<< Updated upstream
            ),
=======
            ],
          ),
          const SizedBox(height: 12),
          
          // Message de bienvenue
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              final name = authProvider.currentUser?.fullName ?? 'Technicien';
              return Text(
                'Bonjour, $name!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              );
            },
>>>>>>> Stashed changes
          ),

          // Body content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsSection(context),
                  const SizedBox(height: 28),
                  _buildFeaturesSection(context),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.07),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: 0,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppTheme.primaryBlue,
          unselectedItemColor: AppTheme.textLight,
          elevation: 0,
          selectedLabelStyle: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: GoogleFonts.inter(fontSize: 12),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Accueil',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.camera_alt_outlined),
              activeIcon: Icon(Icons.camera_alt_rounded),
              label: 'Inspection',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_outlined),
              activeIcon: Icon(Icons.assignment_rounded),
              label: 'Ordres',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profil',
            ),
          ],
          onTap: (index) {
            switch (index) {
              case 0:
                break;
              case 1:
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const InspectionPage(),
                  ),
                );
                break;
              case 2:
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const OrdersListPage(),
                  ),
                );
                break;
              case 3:
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const ProfilePage(),
                  ),
                );
                break;
            }
          },
        ),
      ),
    );
  }

  Widget _buildAppBarIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.18),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
          ),
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }

  Widget _buildWelcomeContent(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.currentUser;
    final now = DateTime.now();
    final months = [
      '',
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Jun',
      'Jul',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc'
    ];
    final dateStr = '${now.day} ${months[now.month]} ${now.year}';

    String greeting;
    if (now.hour < 12) {
      greeting = 'Bonjour';
    } else if (now.hour < 18) {
      greeting = 'Bon après-midi';
    } else {
      greeting = 'Bonsoir';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              '$greeting 👋',
              style: GoogleFonts.inter(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 15,
              ),
            ),
            const Spacer(),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.2),
                ),
              ),
              child: Text(
                dateStr,
                style: GoogleFonts.inter(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          user?.fullName ?? 'Utilisateur',
          style: GoogleFonts.inter(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 4),
        if (user?.role != null)
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              user!.role.name,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildStatsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Vue d\'ensemble',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (c) => const ReportsPage()),
                );
              },
              child: Text(
                'Voir tout',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accentBlue,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _statsLoading
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              )
            : GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.25,
                children: [
                  StatsCard(
                    value: '$_ordresEnCours',
                    label: 'Ordres en cours',
                    icon: Icons.assignment_rounded,
                    color: AppTheme.accentBlue,
                  ),
                  StatsCard(
                    value: '$_controlesEffectues',
                    label: 'Contrôles effectués',
                    icon: Icons.check_circle_rounded,
                    color: AppTheme.successGreen,
                  ),
                  StatsCard(
                    value: '$_anomaliesDetectees',
                    label: 'Anomalies détectées',
                    icon: Icons.warning_rounded,
                    color: AppTheme.warningAmber,
                  ),
                  StatsCard(
                    value: '${_tauxConformite.toStringAsFixed(0)}%',
                    label: 'Taux de conformité',
                    icon: Icons.trending_up_rounded,
                    color: AppTheme.successGreen,
                  ),
                ],
              ),
      ],
    );
  }

  Widget _buildFeaturesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Fonctionnalités',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.textDark,
          ),
        ),
        const SizedBox(height: 14),
        FeatureCard(
          icon: Icons.assignment_outlined,
          title: 'Ordres de fabrication',
          description: 'Consulter et gérer les ordres de fabrication',
          color: AppTheme.accentBlue,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const OrdersListPage()),
            );
          },
        ),
        const SizedBox(height: 12),
        FeatureCard(
          icon: Icons.camera_alt_outlined,
          title: 'Inspection par caméra',
          description: 'Lancer l\'inspection automatique avec IA',
          color: AppTheme.secondaryOrange,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const InspectionPage()),
            );
          },
        ),
        const SizedBox(height: 12),
        FeatureCard(
          icon: Icons.warning_amber_outlined,
          title: 'Gestion des anomalies',
          description: 'Consulter et traiter les anomalies détectées',
          color: AppTheme.warningAmber,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const AnomaliesListPage()),
            );
          },
        ),
        const SizedBox(height: 12),
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
