import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/services/anomaly_service.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/anomaly_detail_page.dart';

class AnomaliesListPage extends StatefulWidget {
  const AnomaliesListPage({super.key});
  @override
  State<AnomaliesListPage> createState() => _AnomaliesListPageState();
}

class _AnomaliesListPageState extends State<AnomaliesListPage> {
  final AnomalyService _service = AnomalyService();
  List<Anomaly> _allAnomalies = [];
  bool _isLoading = true;
  String _selectedSeverity = 'Tous';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final all = await _service.getRecentAnomalies(limit: 200);
    if (mounted) setState(() { _allAnomalies = all; _isLoading = false; });
  }

  List<Anomaly> get _filtered {
    return _allAnomalies.where((a) {
      if (_selectedSeverity == 'Tous') return true;
      if (_selectedSeverity == 'Non traitée') return !a.isResolved;
      return a.severity == _selectedSeverity;
    }).toList();
  }

  Color _getSeverityColor(String s) {
    switch (s) {
      case 'Critique': return const Color(0xFFF43F5E);
      case 'Majeur': return const Color(0xFFF59E0B);
      case 'Mineur': return const Color(0xFF6366F1);
      default: return AppTheme.primaryNavy;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final totalActive = _allAnomalies.where((a) => !a.isResolved).length;
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverAppBar(
            expandedHeight: 150,
            pinned: true,
            backgroundColor: AppTheme.primaryNavy,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF7F1D1D), Color(0xFFF43F5E)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                ),
                child: SafeArea(child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 50),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Registre Anomalies', style: GoogleFonts.inter(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                        Text('$totalActive non-conformités actives', style: GoogleFonts.inter(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w600)),
                      ]),
                    ]),
                  ]),
                )),
              ),
            ),
          ),
        ],
        body: Column(children: [
          _buildFilters(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.accentBlue))
                : filtered.isEmpty ? _buildEmptyState() : _buildList(filtered),
          ),
        ]),
      ),
    );
  }

  Widget _buildFilters() {
    final filters = ['Tous', 'Non traitée', 'Critique', 'Majeur', 'Mineur'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(children: filters.map((f) {
        final sel = _selectedSeverity == f;
        final color = f == 'Non traitée' ? AppTheme.errorRed : _getSeverityColor(f);
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => setState(() => _selectedSeverity = f),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                gradient: sel ? LinearGradient(colors: [color, color.withOpacity(0.8)]) : null,
                color: sel ? null : Colors.white,
                borderRadius: BorderRadius.circular(25),
                border: sel ? null : Border.all(color: AppTheme.borderGris),
                boxShadow: sel ? [BoxShadow(color: color.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))] : null,
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                if (f != 'Tous' && f != 'Non traitée') ...[
                  Container(width: 8, height: 8, decoration: BoxDecoration(color: sel ? Colors.white : color, shape: BoxShape.circle)),
                  const SizedBox(width: 8),
                ],
                Text(f, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: sel ? Colors.white : AppTheme.textGrey)),
              ]),
            ),
          ),
        );
      }).toList()),
    );
  }

  Widget _buildList(List<Anomaly> list) => RefreshIndicator(
    onRefresh: _load,
    child: ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
      itemCount: list.length,
      itemBuilder: (_, i) => _buildAnomalyCard(list[i]),
    ),
  );

  Widget _buildAnomalyCard(Anomaly a) {
    final color = _getSeverityColor(a.severity);
    final isResolved = a.isResolved;
    final dateStr = '${a.detectedAt.day}/${a.detectedAt.month} à ${a.detectedAt.hour}:${a.detectedAt.minute.toString().padLeft(2, '0')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AnomalyDetailPage(anomaly: a))).then((_) => _load()),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withOpacity(0.15)),
            ),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [color.withOpacity(0.15), color.withOpacity(0.05)]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(isResolved ? Icons.check_circle_rounded : Icons.warning_rounded, color: color, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(a.type, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.primaryNavy), overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Text('Câble: ${a.cableId}', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textGrey, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(dateStr, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textLight)),
              ])),
              Column(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                  child: Text(a.severity, style: GoogleFonts.inter(color: color, fontSize: 9, fontWeight: FontWeight.w900)),
                ),
                const SizedBox(height: 6),
                if (isResolved) Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppTheme.successGreen.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text('TRAITÉ', style: GoogleFonts.inter(color: AppTheme.successGreen, fontSize: 8, fontWeight: FontWeight.w900)),
                ),
              ]),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: AppTheme.successGreen.withOpacity(0.08), shape: BoxShape.circle),
      child: const Icon(Icons.check_circle_rounded, size: 48, color: AppTheme.successGreen),
    ),
    const SizedBox(height: 16),
    Text('Aucune anomalie', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
    Text('Tout est en ordre !', style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 12)),
  ]));
}
