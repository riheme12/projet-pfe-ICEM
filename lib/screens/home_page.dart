import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:provider/provider.dart';
import 'package:projeticem/screens/profile_page.dart';
import 'package:projeticem/screens/orders_list_page.dart';
import 'package:projeticem/screens/reports_page.dart';
import 'package:projeticem/screens/inspection_page.dart';
import 'package:projeticem/screens/anomalies_list_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with SingleTickerProviderStateMixin {
  int _currentTab = 0;
  late AnimationController _animCtrl;

  // Données temps réel
  bool _statsLoading = true;
  int _totalInspections = 0;
  int _totalAnomalies = 0;
  double _conformityRate = 0.0;
  int _totalCables = 0;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..forward();
    _loadRealData();
  }

  @override
  void dispose() { _animCtrl.dispose(); super.dispose(); }

  Future<void> _loadRealData() async {
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final techId = auth.currentUser?.id ?? '';
      final service = ReportsService();

      // Requête parallèle pour toutes les données
      final stats = await service.getTechnicianStats(techId, period: 'Ce mois');

      if (mounted) {
        setState(() {
          _totalInspections = stats.inspections;
          _totalAnomalies = stats.anomaliesDetected;
          _conformityRate = stats.conformityRate;
          _totalCables = stats.inspections;
          _statsLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _statsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 210,
          floating: false, pinned: true,
          automaticallyImplyLeading: false,
          backgroundColor: AppTheme.primaryNavy,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E3A5F), Color(0xFF2563EB)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                  _buildTopBar(),
                  const SizedBox(height: 20),
                  _buildWelcome(),
                ]),
              )),
            ),
          ),
        ),
        SliverToBoxAdapter(child: FadeTransition(
          opacity: Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut)),
          child: Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _buildSectionTitle('Mon Activité Ce Mois'),
            const SizedBox(height: 14),
            _buildActivityBanner(),
            const SizedBox(height: 28),
            _buildSectionTitle('Pilotage Industriel'),
            const SizedBox(height: 14),
            _buildFeatures(),
            const SizedBox(height: 40),
          ])),
        )),
      ]),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildSectionTitle(String title) => Text(
    title,
    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy, letterSpacing: -0.5),
  );

  Widget _buildTopBar() {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
          ),
          child: const Icon(Icons.auto_awesome_mosaic_rounded, color: AppTheme.primaryNavy, size: 18),
        ),
        const SizedBox(width: 12),
        Text('ICEM', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1)),
      ]),
      GestureDetector(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfilePage())),
        child: Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white38, width: 2)),
          child: const CircleAvatar(radius: 16, backgroundColor: Colors.white24, child: Icon(Icons.person_rounded, color: Colors.white, size: 18)),
        ),
      ),
    ]);
  }

  Widget _buildWelcome() {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.currentUser;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Bonjour, ${user?.fullName ?? "Utilisateur"}', style: GoogleFonts.inter(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
      const SizedBox(height: 2),
      Text('Centre de Contrôle', style: GoogleFonts.inter(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
      const SizedBox(height: 10),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white24),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppTheme.successGreen, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(user?.role.name.toUpperCase() ?? 'TECHNICIEN', style: GoogleFonts.inter(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1)),
        ]),
      ),
    ]);
  }

  /// Bannière compacte avec les 4 KPIs temps réel côte à côte
  Widget _buildActivityBanner() {
    if (_statsLoading) {
      return Container(
        height: 100,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        child: const Center(child: CircularProgressIndicator(color: AppTheme.accentBlue, strokeWidth: 2)),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: const Color(0xFF0F172A).withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Column(children: [
        // Titre de la bannière
        Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.insights_rounded, color: Colors.white, size: 14),
          ),
          const SizedBox(width: 10),
          Text('Performance du Mois', style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
          const Spacer(),
          GestureDetector(
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsPage())),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Text('Voir +', style: GoogleFonts.inter(color: Colors.white70, fontSize: 9, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
        const SizedBox(height: 16),
        // 4 KPIs en ligne
        Row(children: [
          _bannerKpi('$_totalInspections', 'Inspections', const Color(0xFF6366F1)),
          _bannerDivider(),
          _bannerKpi('${_conformityRate.toStringAsFixed(0)}%', 'Conformité', const Color(0xFF10B981)),
          _bannerDivider(),
          _bannerKpi('$_totalAnomalies', 'Anomalies', const Color(0xFFF43F5E)),
          _bannerDivider(),
          _bannerKpi('$_totalCables', 'Câbles', const Color(0xFF0EA5E9)),
        ]),
      ]),
    );
  }

  Widget _bannerKpi(String value, String label, Color color) => Expanded(
    child: Column(children: [
      Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
      const SizedBox(height: 4),
      Text(label, style: GoogleFonts.inter(fontSize: 9, color: Colors.white54, fontWeight: FontWeight.w700)),
    ]),
  );

  Widget _bannerDivider() => Container(width: 1, height: 36, color: Colors.white12);

  Widget _buildFeatures() {
    return Column(children: [
      _featureTile(Icons.assignment_rounded, 'Ordres de Fabrication', 'Gérer les productions', const Color(0xFF6366F1),
        () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersListPage()))),
      _featureTile(Icons.camera_alt_rounded, 'Inspection Vision IA', 'Contrôle automatique', const Color(0xFF0EA5E9),
        () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InspectionPage()))),
      _featureTile(Icons.notification_important_rounded, 'Registre Anomalies', 'Suivi non-conformités', const Color(0xFFF43F5E),
        () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnomaliesListPage()))),
      _featureTile(Icons.insights_rounded, 'Rapports & Analytics', 'Performance industrielle', const Color(0xFF10B981),
        () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsPage()))),
    ]);
  }

  Widget _featureTile(IconData icon, String title, String desc, Color color, VoidCallback onTap) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    child: Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.1)),
          ),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [color.withOpacity(0.15), color.withOpacity(0.05)]),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.primaryNavy)),
              const SizedBox(height: 2),
              Text(desc, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textGrey, fontWeight: FontWeight.w500)),
            ])),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: AppTheme.surfaceGrey, borderRadius: BorderRadius.circular(8)),
              child: Icon(Icons.arrow_forward_ios_rounded, size: 12, color: color),
            ),
          ]),
        ),
      ),
    ),
  );

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, -2))],
      ),
      child: BottomNavigationBar(
        currentIndex: _currentTab,
        backgroundColor: Colors.white,
        elevation: 0,
        selectedItemColor: AppTheme.accentBlue,
        unselectedItemColor: AppTheme.textLight,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 10),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 10),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded, size: 22), label: 'Tableau'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner_rounded, size: 22), label: 'Scanner'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded, size: 22), label: 'Profil'),
        ],
        onTap: (i) {
          setState(() => _currentTab = i);
          if (i == 1) Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersListPage()));
          if (i == 2) Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfilePage()));
        },
      ),
    );
  }
}
