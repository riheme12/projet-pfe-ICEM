import 'package:flutter/material.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/services/anomaly_service.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';

/// Page de détail pour une anomalie spécifique
class AnomalyDetailPage extends StatefulWidget {
  final Anomaly anomaly;

  const AnomalyDetailPage({super.key, required this.anomaly});

  @override
  State<AnomalyDetailPage> createState() => _AnomalyDetailPageState();
}

class _AnomalyDetailPageState extends State<AnomalyDetailPage> {
  bool _isProcessing = false;
  final AnomalyService _anomalyService = AnomalyService();
  final TextEditingController _correctiveController = TextEditingController();
  bool _imageError = false;

  @override
  void dispose() {
    _correctiveController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Détails de l\'Anomalie',
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageSection(),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // En-tête : Type + Gravité
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          widget.anomaly.type,
                          style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800),
                        ),
                      ),
                      StatusBadge(status: widget.anomaly.severity),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Statut actuel
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: widget.anomaly.isResolved
                          ? AppTheme.successGreen.withValues(alpha: 0.1)
                          : AppTheme.warningAmber.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          widget.anomaly.isResolved ? Icons.check_circle : Icons.pending,
                          size: 16,
                          color: widget.anomaly.isResolved ? AppTheme.successGreen : AppTheme.warningAmber,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          widget.anomaly.isResolved ? 'Traitée' : 'En attente de traitement',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: widget.anomaly.isResolved ? AppTheme.successGreen : AppTheme.warningAmber,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  Text(
                    'Détecté le ${widget.anomaly.detectedAt.day.toString().padLeft(2, '0')}/${widget.anomaly.detectedAt.month.toString().padLeft(2, '0')}/${widget.anomaly.detectedAt.year} à ${widget.anomaly.detectedAt.hour}:${widget.anomaly.detectedAt.minute.toString().padLeft(2, '0')}',
                    style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 14),
                  ),
                  const Divider(height: 32),

                  // Informations détaillées
                  _buildDetailRow(Icons.cable, 'Câble concerné', widget.anomaly.cableId),
                  if (widget.anomaly.orderId != null)
                    _buildDetailRow(Icons.assignment, 'Ordre de fabrication', widget.anomaly.orderId!),
                  _buildDetailRow(Icons.location_on, 'Localisation', widget.anomaly.location ?? 'Non spécifiée'),
                  _buildDetailRow(Icons.psychology, 'Confiance IA', '${(widget.anomaly.confidence * 100).toStringAsFixed(1)}%'),
                  if (widget.anomaly.technicianName != null)
                    _buildDetailRow(Icons.person, 'Technicien', widget.anomaly.technicianName!),

                  if (widget.anomaly.mesureCorrective != null && widget.anomaly.mesureCorrective!.isNotEmpty) ...[
                    const Divider(height: 32),
                    Text(
                      'Mesure corrective appliquée',
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.successGreen.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.successGreen.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        widget.anomaly.mesureCorrective!,
                        style: GoogleFonts.inter(fontSize: 14, height: 1.5),
                      ),
                    ),
                  ],

                  const SizedBox(height: 28),
                  Text(
                    'Actions recommandées',
                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  _buildRecommendationCard(),

                  if (!widget.anomaly.isResolved) ...[
                    const SizedBox(height: 24),
                    Text(
                      'Mesure corrective',
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _correctiveController,
                      maxLines: 3,
                      style: GoogleFonts.inter(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Décrivez la mesure corrective appliquée...',
                        hintStyle: GoogleFonts.inter(color: AppTheme.textLight, fontSize: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppTheme.primaryBlue, width: 2),
                        ),
                        contentPadding: const EdgeInsets.all(16),
                      ),
                    ),
                    const SizedBox(height: 24),
                    _buildActionButtons(),
                  ],

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Affiche l'image réelle de l'anomalie depuis Firebase Storage
  Widget _buildImageSection() {
    if (widget.anomaly.imageUrl != null && widget.anomaly.imageUrl!.isNotEmpty && !_imageError) {
      return GestureDetector(
        onTap: () => _showFullScreenImage(context),
        child: Stack(
          children: [
            SizedBox(
              height: 280,
              width: double.infinity,
              child: widget.anomaly.imageUrl!.startsWith('data:image')
                ? Image.memory(
                    base64Decode(widget.anomaly.imageUrl!.split(',').last),
                    fit: BoxFit.cover,
                  )
                : Image.network(
                    widget.anomaly.imageUrl!,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 280,
                        color: AppTheme.dividerGrey,
                        child: Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                : null,
                          ),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted) setState(() => _imageError = true);
                      });
                      return _buildImagePlaceholder();
                    },
                  ),
            ),
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                    const SizedBox(width: 6),
                    Text(
                      'Vue IA — Appuyez pour agrandir',
                      style: GoogleFonts.inter(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }
    return _buildImagePlaceholder();
  }

  Widget _buildImagePlaceholder() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.grey.shade200, Colors.grey.shade100],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.image_not_supported, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 8),
            Text(
              'Aucune image disponible',
              style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  void _showFullScreenImage(BuildContext context) {
    if (widget.anomaly.imageUrl == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            title: Text('Image du défaut', style: GoogleFonts.inter(fontSize: 16)),
          ),
          body: Center(
            child: InteractiveViewer(
              minScale: 0.5,
              maxScale: 4.0,
              child: widget.anomaly.imageUrl!.startsWith('data:image')
                  ? Image.memory(base64Decode(widget.anomaly.imageUrl!.split(',').last), fit: BoxFit.contain)
                  : Image.network(widget.anomaly.imageUrl!, fit: BoxFit.contain),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primaryBlue),
          const SizedBox(width: 12),
          Text('$label: ', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
          Expanded(
            child: Text(value, style: GoogleFonts.inter(fontSize: 14)),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationCard() {
    String recommendation = '';
    Color cardColor = Colors.grey;

    switch (widget.anomaly.severity) {
      case 'Critique':
        recommendation = 'Arrêt immédiat de la production. Le câble doit être mis au rebut et l\'incident analysé.';
        cardColor = AppTheme.errorRed.withValues(alpha: 0.1);
        break;
      case 'Majeur':
        recommendation = 'Isolation du lot pour inspection manuelle approfondie par un responsable qualité.';
        cardColor = AppTheme.secondaryOrange.withValues(alpha: 0.1);
        break;
      case 'Mineur':
        recommendation = 'Marquer pour suivi, mais peut être accepté selon les tolérances du client.';
        cardColor = AppTheme.warningAmber.withValues(alpha: 0.1);
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cardColor.withValues(alpha: 0.5)),
      ),
      child: Text(recommendation, style: GoogleFonts.inter(height: 1.5, fontSize: 14)),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Fermer', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            onPressed: _isProcessing ? null : _processAnomaly,
            icon: _isProcessing
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.check_circle_rounded),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.successGreen,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            label: Text(
              _isProcessing ? 'Traitement...' : 'Marquer comme résolue',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _processAnomaly() async {
    setState(() => _isProcessing = true);
    final success = await _anomalyService.markAsResolved(
      widget.anomaly.id,
      correctiveAction: _correctiveController.text.trim(),
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(
                success ? Icons.check_circle : Icons.error,
                color: Colors.white,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                success
                    ? 'Anomalie résolue — Le câble est de nouveau conforme.'
                    : 'Impossible de mettre à jour cette anomalie.',
                style: GoogleFonts.inter(fontSize: 14),
              ),
            ],
          ),
          backgroundColor: success ? AppTheme.successGreen : AppTheme.errorRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      if (success) {
        Navigator.pop(context, true); // Return true to signal refresh needed
      } else {
        setState(() => _isProcessing = false);
      }
    }
  }
}
