import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/models/report.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:projeticem/services/pdf_export_service.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Page Rapports & Analytics — Données dynamiques du technicien
class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});
  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> with SingleTickerProviderStateMixin {
  final ReportsService _service = ReportsService();
  late TabController _tabCtrl;

  TechnicianStats? _techStats;
  List<Report> _reports = [];
  bool _isLoading = true;
  String _period = 'Ce mois';

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    
    // Rafraîchir le profil pour récupérer la signatureUrl à jour
    await auth.refreshCurrentUser();
    
    final userId = auth.currentUser?.id ?? '';

    final results = await Future.wait([
      _service.getTechnicianStats(userId, period: _period),
      _service.getMyReports(userId, period: _period, limit: 50),
    ]);

    if (!mounted) return;
    setState(() {
      _techStats = results[0] as TechnicianStats;
      _reports = results[1] as List<Report>;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 170,
            pinned: true,
            backgroundColor: AppTheme.primaryNavy,
            flexibleSpace: FlexibleSpaceBar(background: _buildHeroHeader()),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(48),
              child: Container(
                color: Colors.white,
                child: TabBar(
                  controller: _tabCtrl,
                  indicatorColor: AppTheme.accentBlue,
                  indicatorWeight: 3,
                  labelColor: AppTheme.accentBlue,
                  unselectedLabelColor: AppTheme.textGrey,
                  labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 12),
                  tabs: const [
                    Tab(text: 'Mon Rendement'),
                    Tab(text: 'Mes Rapports'),
                  ],
                ),
              ),
            ),
          ),
        ],
        body: TabBarView(controller: _tabCtrl, children: [
          _buildPerformanceView(),
          _buildReportsView(),
        ]),
      ),
    );
  }

  // ─── Hero Header ──────────────────────────────────────────────────────
  Widget _buildHeroHeader() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.currentUser;
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E3A5F), Color(0xFF2563EB)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 56),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.bar_chart_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Performance & Analytics', style: GoogleFonts.inter(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900)),
              Text(user?.fullName ?? 'Technicien', style: GoogleFonts.inter(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w600)),
            ])),
          ]),
        ]),
      )),
    );
  }

  // ─── TAB 1: Performance View ──────────────────────────────────────────
  Widget _buildPerformanceView() {
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: AppTheme.accentBlue));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        _buildPeriodSelector(),
        const SizedBox(height: 20),
        _buildScoreCard(),
        const SizedBox(height: 16),
        _buildKPIGrid(),
        const SizedBox(height: 20),
        _buildDefectsBreakdown(),
        const SizedBox(height: 20),
        _buildSeverityChart(),
        const SizedBox(height: 24),
        _buildExportButton(),
        const SizedBox(height: 40),
      ]),
    );
  }

  Widget _buildPeriodSelector() {
    final periods = ['Aujourd\'hui', 'Cette semaine', 'Ce mois'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: periods.map((p) {
        final sel = _period == p;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () { setState(() => _period = p); _load(); },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                gradient: sel ? const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF3B82F6)]) : null,
                color: sel ? null : Colors.white,
                borderRadius: BorderRadius.circular(25),
                border: sel ? null : Border.all(color: AppTheme.borderGris),
                boxShadow: sel ? [BoxShadow(color: AppTheme.accentBlue.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))] : null,
              ),
              child: Text(p, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: sel ? Colors.white : AppTheme.textGrey)),
            ),
          ),
        );
      }).toList()),
    );
  }

  // ─── Score Card Principal ─────────────────────────────────────────────
  Widget _buildScoreCard() {
    final rate = _techStats?.conformityRate ?? 0;
    final color = rate >= 80 ? AppTheme.successGreen : rate >= 50 ? AppTheme.warningAmber : AppTheme.errorRed;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.05), color.withOpacity(0.02)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2), width: 1.5),
      ),
      child: Row(children: [
        SizedBox(
          width: 72, height: 72,
          child: Stack(alignment: Alignment.center, children: [
            SizedBox(width: 72, height: 72, child: CircularProgressIndicator(
              value: rate / 100, strokeWidth: 6,
              backgroundColor: color.withOpacity(0.15),
              valueColor: AlwaysStoppedAnimation(color),
              strokeCap: StrokeCap.round,
            )),
            Text('${rate.toStringAsFixed(0)}%', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: color)),
          ]),
        ),
        const SizedBox(width: 20),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Taux de Conformité', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
          const SizedBox(height: 4),
          Text(
            rate >= 80 ? 'Excellent travail !' : rate >= 50 ? 'Peut mieux faire' : 'Attention requise',
            style: GoogleFonts.inter(fontSize: 12, color: color, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Row(children: [
            _miniStat('${_techStats?.cablesConform ?? 0}', 'OK', AppTheme.successGreen),
            const SizedBox(width: 16),
            _miniStat('${_techStats?.cablesNonConform ?? 0}', 'NC', AppTheme.errorRed),
            const SizedBox(width: 16),
            _miniStat('${_techStats?.resolutionRate ?? 0}%', 'Résolu', AppTheme.accentBlue),
          ]),
        ])),
      ]),
    );
  }

  Widget _miniStat(String val, String label, Color color) => Column(children: [
    Text(val, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: color)),
    Text(label, style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textGrey, fontWeight: FontWeight.w700)),
  ]);

  // ─── KPI Grid ─────────────────────────────────────────────────────────
  Widget _buildKPIGrid() {
    return GridView.count(
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 1.5,
      children: [
        _kpiCard('${_techStats?.inspections ?? 0}', 'Câbles Inspectés', Icons.cable_rounded, const Color(0xFF6366F1), const Color(0xFF8B5CF6)),
        _kpiCard('${_techStats?.anomaliesDetected ?? 0}', 'Défauts Détectés', Icons.bug_report_rounded, const Color(0xFFF43F5E), const Color(0xFFE11D48)),
        _kpiCard('${_techStats?.anomaliesResolved ?? 0}', 'Défauts Corrigés', Icons.build_circle_rounded, const Color(0xFF10B981), const Color(0xFF059669)),
        _kpiCard('${_techStats?.resolutionRate ?? 0}%', 'Taux Résolution', Icons.auto_fix_high_rounded, const Color(0xFFF59E0B), const Color(0xFFD97706)),
      ],
    );
  }

  Widget _kpiCard(String value, String label, IconData icon, Color c1, Color c2) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: c1.withOpacity(0.15)),
      boxShadow: [BoxShadow(color: c1.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(gradient: LinearGradient(colors: [c1, c2]), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 16, color: Colors.white),
        ),
        Flexible(child: Text(value, style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy))),
      ]),
      Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey, fontWeight: FontWeight.w700)),
    ]),
  );

  static const Map<String, String> _defectNamesMap = {
    'A': 'Cosse déformée', 'B': 'Cosse ébanchati', 'C': 'Cosse ouverte',
    'D': 'Fil pincé/coupé', 'E': 'Fils inversés', 'F': 'Fil tendu',
    'G': 'Fil sans cosse', 'H': 'Ticket élec. NC', 'I': 'Long./couleur NC',
    'J': 'Conn. cassé', 'K': 'Bouchette manq.', 'L': 'Tube thermo NC',
    'M': 'Protection manq.', 'N': 'Tube manqué', 'O': 'Vis mal serrée',
    'P': 'Composant manq.', 'Q': 'Fusible manq.', 'R': 'Gamme manq.',
    'S': 'Scotch mal exécuté', 'T': 'Mesure Dériv.', 'V': 'Étiquette manquante',
    'W': 'Étiquette inv.', 'Z': 'Autres défauts',
  };

  String _getCleanDefectName(String rawKey) {
    String key = rawKey.trim();
    
    // 1. Remove "Défauts: " or "Défaut: " prefix if it exists
    if (key.startsWith('Défauts:') || key.startsWith('Défaut:')) {
      final codePart = key.split(':').last.trim();
      final codes = codePart.split(',').map((c) => c.trim().toUpperCase()).toList();
      final names = codes.map((c) => _defectNamesMap[c] ?? c).toList();
      return names.join(', ');
    }
    
    // 2. Remove "[Code] " prefix if it exists (e.g. "[A] Cosse déformée" -> "Cosse déformée")
    final match = RegExp(r'^\[[A-Z]\]\s+(.+)$').firstMatch(key);
    if (match != null) {
      return match.group(1)!;
    }
    
    // 3. Map raw Roboflow classes to clean names
    final classMapping = {
      'composant_mal_insere': 'Composant mal inséré',
      'composant_mal _insere': 'Composant mal inséré',
      'composant_manquant': 'Composant manquant',
      'etiquette_anomalie': 'Étiquette manquante',
      'protection_anomalie': 'Anomalie protection',
      'connecteur_anomalie': 'Anomalie connecteur',
      'cosse_anomalie': 'Anomalie cosse',
      'scotche_anomalie': 'Scotch mal exécuté',
      'anomalie scotch': 'Scotch mal exécuté',
      'anomalie étiquette': 'Étiquette manquante',
      'anomalie protection': 'Protection manquante',
      'anomalie connecteur': 'Connecteur cassé',
      'anomalie cosse': 'Cosse déformée',
    };
    
    final lowerKey = key.toLowerCase();
    if (classMapping.containsKey(lowerKey)) {
      return classMapping[lowerKey]!;
    }
    
    // 4. Map electrical check abbreviations
    final electricalMapping = {
      'fi conn.': 'Fils inversés connecteur',
      'fmi conn.': 'Fils mal insérés connecteur',
      'fi pos.': 'Fils inversés position',
      'fmi pos.': 'Fils mal insérés position',
      'fi mar/coul': 'Fils inversés marquage/couleur',
      'étiq. manq.': 'Étiquette manquante',
      'étiq. inv. c1': 'Étiquette invertie Conn 1',
      'étiq. inv. c2': 'Étiquette invertie Conn 2',
      'conn. dériv.': 'Connecteur dérivation',
      'prot. manq.': 'Protection manquante connecteur',
    };
    
    if (key.startsWith('Défaut Électrique:')) {
      final label = key.split(':').last.trim().toLowerCase();
      return electricalMapping[label] ?? key;
    }
    
    return key;
  }

  // ─── Defects Breakdown ────────────────────────────────────────────────
  Widget _buildDefectsBreakdown() {
    final rawMap = _techStats?.anomaliesByType ?? {};
    if (rawMap.isEmpty) return const SizedBox.shrink();

    // Aggregate and clean names dynamically to sum counts of merged names
    final Map<String, int> map = {};
    rawMap.forEach((key, val) {
      final cleanKey = _getCleanDefectName(key);
      map[cleanKey] = (map[cleanKey] ?? 0) + val;
    });

    final total = map.values.fold(0, (a, b) => a + b);
    final colors = [
      const Color(0xFF6366F1), const Color(0xFFF43F5E), const Color(0xFFF59E0B),
      const Color(0xFF10B981), const Color(0xFF06B6D4), const Color(0xFF8B5CF6),
      const Color(0xFFEC4899), const Color(0xFF14B8A6),
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderGris),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: const Color(0xFF6366F1).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.donut_large_rounded, size: 16, color: Color(0xFF6366F1)),
          ),
          const SizedBox(width: 10),
          Text('Répartition des Défauts', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
        ]),
        const SizedBox(height: 16),
        // Stacked bar
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: SizedBox(
            height: 10,
            child: Row(children: map.entries.toList().asMap().entries.map((entry) {
              final pct = total > 0 ? entry.value.value / total : 0.0;
              return Expanded(
                flex: (pct * 100).round().clamp(1, 100),
                child: Container(color: colors[entry.key % colors.length]),
              );
            }).toList()),
          ),
        ),
        const SizedBox(height: 16),
        ...map.entries.toList().asMap().entries.map((entry) {
          final pct = total > 0 ? (entry.value.value / total) * 100 : 0.0;
          final color = colors[entry.key % colors.length];
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(children: [
              Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
              const SizedBox(width: 10),
              Expanded(child: Text(entry.value.key, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textDark, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Text('${entry.value.value} (${pct.toStringAsFixed(0)}%)', style: GoogleFonts.inter(fontSize: 10, color: color, fontWeight: FontWeight.w800)),
              ),
            ]),
          );
        }),
      ]),
    );
  }

  // ─── Severity Chart ───────────────────────────────────────────────────
  Widget _buildSeverityChart() {
    final sev = _techStats?.anomaliesBySeverity ?? {};
    final total = sev.values.fold(0, (a, b) => a + b);
    if (total == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderGris),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Gravité des Anomalies', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
        const SizedBox(height: 16),
        _sevRow('Critique', sev['Critique'] ?? 0, total, AppTheme.errorRed),
        const SizedBox(height: 10),
        _sevRow('Majeur', sev['Majeur'] ?? 0, total, AppTheme.warningAmber),
        const SizedBox(height: 10),
        _sevRow('Mineur', sev['Mineur'] ?? 0, total, AppTheme.accentBlue),
      ]),
    );
  }

  Widget _sevRow(String label, int count, int total, Color color) {
    final pct = total > 0 ? count / total : 0.0;
    return Row(children: [
      SizedBox(width: 60, child: Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textGrey))),
      Expanded(child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(value: pct, minHeight: 8, backgroundColor: color.withOpacity(0.1), valueColor: AlwaysStoppedAnimation(color)),
      )),
      const SizedBox(width: 10),
      Text('$count', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: color)),
    ]);
  }

  // ─── Export Button ────────────────────────────────────────────────────
  Widget _buildExportButton() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)]),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppTheme.primaryNavy.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: _exportPdf,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 18),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.picture_as_pdf_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Text('EXPORTER MON RAPPORT PDF', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
            ]),
          ),
        ),
      ),
    );
  }

  Future<void> _exportPdf() async {
    if (_techStats == null) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    
    // Rafraîchir le profil pour récupérer la signatureUrl à jour
    await auth.refreshCurrentUser();
    
    final name = auth.currentUser?.fullName ?? 'Technicien';
    final uid = auth.currentUser?.id ?? '';
    final signature = auth.currentUser?.signatureUrl;

    try {
      // 1. Générer le PDF avec la signature
      await PdfExportService.exportTechnicianReport(
        technicianName: name,
        stats: _techStats!,
        period: _period,
        signatureUrl: signature,
      );

      // 2. Enregistrer dans Firestore pour que ça apparaisse dans "Mes Rapports"
      await _service.createReportRecord(
        technicianId: uid,
        technicianName: name,
        type: 'performance',
        period: _period,
      );

      // 3. Rafraîchir la liste
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Erreur lors de l\'export: $e'),
          backgroundColor: AppTheme.errorRed,
        ));
      }
    }
  }

  // ─── TAB 2: Mes Rapports ──────────────────────────────────────────────
  Widget _buildReportsView() {
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: AppTheme.accentBlue));
    return RefreshIndicator(
      onRefresh: _load,
      child: _reports.isEmpty
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(color: AppTheme.accentBlue.withOpacity(0.08), shape: BoxShape.circle),
                child: const Icon(Icons.description_outlined, size: 48, color: AppTheme.accentBlue),
              ),
              const SizedBox(height: 16),
              Text('Aucun rapport trouvé', style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textGrey, fontWeight: FontWeight.w700)),
              Text('pour cette période', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textLight)),
            ]))
          : Column(children: [
              // Header avec compteur
              Container(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(children: [
                  Text('${_reports.length}', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
                  const SizedBox(width: 8),
                  Text('rapports générés', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textGrey, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  _buildPeriodChip(),
                ]),
              ),
              Expanded(child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                itemCount: _reports.length,
                itemBuilder: (_, i) => _buildReportCard(_reports[i]),
              )),
            ]),
    );
  }

  Widget _buildPeriodChip() => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: AppTheme.accentBlue.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
    child: Text(_period, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.accentBlue, fontWeight: FontWeight.w800)),
  );

  Widget _buildReportCard(Report r) {
    final isPerformance = r.type == 'performance' || r.cableId == 'Rapport Global';
    final isConform = r.conformityStatus.toLowerCase().contains('conforme') && !r.conformityStatus.toLowerCase().contains('non');

    final Color accentColor;
    final IconData icon;
    final String subtitle;

    if (isPerformance) {
      accentColor = const Color(0xFF6366F1);
      icon = Icons.analytics_rounded;
      subtitle = r.conformityStatus;
    } else if (isConform) {
      accentColor = AppTheme.successGreen;
      icon = Icons.check_circle_rounded;
      subtitle = 'Câble: ${r.cableId}';
    } else {
      accentColor = AppTheme.errorRed;
      icon = Icons.warning_rounded;
      subtitle = 'Câble: ${r.cableId} • ${r.anomaliesCount} défaut(s)';
    }

    final dateStr = '${r.generatedAt.day}/${r.generatedAt.month}/${r.generatedAt.year} ${r.generatedAt.hour}:${r.generatedAt.minute.toString().padLeft(2, '0')}';

    return InkWell(
      onTap: () async {
        if (isPerformance) {
          if (_techStats == null) return;
          await PdfExportService.exportTechnicianReport(
            technicianName: r.technicianName ?? 'Technicien',
            stats: _techStats!,
            period: r.conformityStatus.replaceAll('Rapport ', ''),
            signatureUrl: r.signatureUrl,
          );
        } else {
          await PdfExportService.exportInspectionReport(r);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: accentColor.withOpacity(0.15)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: accentColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: accentColor, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(
            isPerformance ? 'Rapport de Performance' : 'Rapport d\'Inspection',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.primaryNavy),
          ),
          const SizedBox(height: 3),
          Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textGrey, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(dateStr, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textLight)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(color: accentColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
          child: Text(
            isPerformance ? 'PDF' : (isConform ? 'OK' : 'NC'),
            style: GoogleFonts.inter(color: accentColor, fontSize: 10, fontWeight: FontWeight.w900),
          ),
        ),
        ]),
      ),
    );
  }
}
