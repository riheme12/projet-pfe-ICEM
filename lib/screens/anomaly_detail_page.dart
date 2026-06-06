import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/services/anomaly_service.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Page de détail d'une anomalie — Design Unifié
class AnomalyDetailPage extends StatefulWidget {
  final Anomaly anomaly;
  const AnomalyDetailPage({super.key, required this.anomaly});
  @override
  State<AnomalyDetailPage> createState() => _AnomalyDetailPageState();
}

class _AnomalyDetailPageState extends State<AnomalyDetailPage> {
  final _correctiveCtrl = TextEditingController();
  bool _isResolving = false;

  Color get _severityColor {
    switch (widget.anomaly.severity) {
      case 'Critique': return const Color(0xFFF43F5E);
      case 'Majeur': return const Color(0xFFF59E0B);
      default: return const Color(0xFF6366F1);
    }
  }

  Future<void> _resolve() async {
    if (_correctiveCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Text('Veuillez saisir la mesure corrective'),
        backgroundColor: AppTheme.errorRed,
      ));
      return;
    }

    setState(() => _isResolving = true);
    final ok = await AnomalyService().markAsResolved(
      widget.anomaly.id,
      correctiveAction: _correctiveCtrl.text.trim(),
    );
    setState(() => _isResolving = false);

    if (!mounted) return;
    if (ok) Navigator.pop(context, true);
  }

  @override
  void dispose() { _correctiveCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final a = widget.anomaly;
    final resolved = a.isResolved;
    final color = _severityColor;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 140,
          pinned: true,
          backgroundColor: AppTheme.primaryNavy,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFF0F172A), color.withOpacity(0.8), color],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 50),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
                      child: Icon(resolved ? Icons.check_circle_rounded : Icons.warning_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Détail Anomalie', style: GoogleFonts.inter(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900)),
                      Text(resolved ? 'Traitée' : 'En attente de correction', style: GoogleFonts.inter(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w600)),
                    ])),
                  ]),
                ]),
              )),
            ),
          ),
        ),
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _buildStatusHeader(resolved, color),
            const SizedBox(height: 20),
            _buildInfoCard(a),
            const SizedBox(height: 20),
            _buildImageSection(a),
            const SizedBox(height: 24),
            if (!resolved) _buildResolutionForm(),
            if (resolved) _buildResolutionResult(a),
            const SizedBox(height: 40),
          ]),
        )),
      ]),
    );
  }

  Widget _buildStatusHeader(bool resolved, Color color) {
    final statusColor = resolved ? const Color(0xFF10B981) : color;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [statusColor.withOpacity(0.08), statusColor.withOpacity(0.02)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: statusColor.withOpacity(0.2), width: 1.5),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [statusColor.withOpacity(0.15), statusColor.withOpacity(0.05)]),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(resolved ? Icons.check_circle_rounded : Icons.warning_rounded, color: statusColor, size: 24),
        ),
        const SizedBox(width: 14),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(resolved ? 'STATUT : RÉSOLUE' : 'STATUT : EN COURS', style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: statusColor, fontSize: 13)),
          const SizedBox(height: 2),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(widget.anomaly.severity.toUpperCase(), style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: color, fontSize: 9)),
          ),
        ]),
      ]),
    );
  }

  Widget _buildInfoCard(Anomaly a) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderGris),
      ),
      child: Column(children: [
        _infoRow(Icons.report_problem, 'Type', a.type, const Color(0xFFF43F5E)),
        Divider(height: 24, color: AppTheme.borderGris.withOpacity(0.5)),
        _infoRow(Icons.cable, 'Code Câble', a.cableId, const Color(0xFF6366F1)),
        Divider(height: 24, color: AppTheme.borderGris.withOpacity(0.5)),
        _infoRow(Icons.person, 'Détecté par', a.technicianName ?? 'Technicien', const Color(0xFF0EA5E9)),
        Divider(height: 24, color: AppTheme.borderGris.withOpacity(0.5)),
        _infoRow(Icons.calendar_today, 'Date', '${a.detectedAt.day}/${a.detectedAt.month}/${a.detectedAt.year}', const Color(0xFF10B981)),
      ]),
    );
  }

  Widget _infoRow(IconData icon, String label, String value, Color color) => Row(children: [
    Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Icon(icon, size: 16, color: color),
    ),
    const SizedBox(width: 12),
    Text(label, style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 12, fontWeight: FontWeight.w600)),
    const Spacer(),
    Flexible(child: Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: AppTheme.primaryNavy, fontSize: 12), overflow: TextOverflow.ellipsis, textAlign: TextAlign.end)),
  ]);

  Widget _buildSingleImage(String url) {
    Widget img;
    if (url.startsWith('data:image')) {
      final base64String = url.split(',').last;
      img = Image.memory(base64Decode(base64String), fit: BoxFit.cover);
    } else {
      img = Image.network(
        url,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Center(
          child: Icon(Icons.broken_image, size: 30, color: AppTheme.textLight),
        ),
      );
    }
    return Container(
      width: 150,
      height: 110,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderGris),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: img,
      ),
    );
  }

  Widget _buildImageSection(Anomaly a) {
    final images = a.imageUrls ?? (a.imageUrl != null && a.imageUrl!.isNotEmpty ? [a.imageUrl!] : []);
    if (images.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Preuves Visuelles (${images.length})',
          style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 14, color: AppTheme.primaryNavy),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: images.map((url) => _buildSingleImage(url)).toList(),
        ),
      ],
    );
  }

  Widget _buildResolutionForm() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderGris),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.build_circle_rounded, size: 16, color: Color(0xFF10B981)),
          ),
          const SizedBox(width: 10),
          Text('Action Corrective', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 14, color: AppTheme.primaryNavy)),
        ]),
        const SizedBox(height: 14),
        TextField(
          controller: _correctiveCtrl,
          maxLines: 3,
          style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textDark),
          decoration: const InputDecoration(hintText: 'Décrivez la correction effectuée...'),
        ),
        const SizedBox(height: 20),
        Container(
          width: double.infinity,
          height: 50,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))],
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: _isResolving ? null : _resolve,
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                _isResolving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Text(_isResolving ? 'ENREGISTREMENT...' : 'VALIDER LA CORRECTION', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _buildResolutionResult(Anomaly a) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [const Color(0xFF10B981).withOpacity(0.08), const Color(0xFF10B981).withOpacity(0.02)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.build_circle_rounded, size: 16, color: Color(0xFF10B981)),
          ),
          const SizedBox(width: 10),
          Text('MESURE CORRECTIVE APPLIQUÉE', style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: const Color(0xFF10B981), fontSize: 11)),
        ]),
        const SizedBox(height: 12),
        Text(a.correctiveAction ?? 'Corrigé sur place', style: GoogleFonts.inter(color: AppTheme.textDark, fontSize: 14, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
