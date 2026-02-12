import 'package:flutter/material.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/widgets/status_badge.dart';

/// Page de détail pour une anomalie spécifique
class AnomalyDetailPage extends StatefulWidget {
  final Anomaly anomaly;

  const AnomalyDetailPage({super.key, required this.anomaly});

  @override
  State<AnomalyDetailPage> createState() => _AnomalyDetailPageState();
}

class _AnomalyDetailPageState extends State<AnomalyDetailPage> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails de l\'Anomalie'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImagePlaceholder(),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.anomaly.type,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      StatusBadge(status: widget.anomaly.severity),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Détecté le ${widget.anomaly.detectedAt.day}/${widget.anomaly.detectedAt.month}/${widget.anomaly.detectedAt.year} à ${widget.anomaly.detectedAt.hour}:${widget.anomaly.detectedAt.minute}',
                    style: const TextStyle(color: AppTheme.textGrey),
                  ),
                  const Divider(height: 40),
                  _buildDetailRow(Icons.cable, 'Câble concerné', widget.anomaly.cableId),
                  _buildDetailRow(Icons.location_on, 'Localisation', widget.anomaly.location ?? 'Non spécifiée'),
                  _buildDetailRow(Icons.psychology, 'Confiance IA', '${(widget.anomaly.confidence * 100).toStringAsFixed(1)}%'),
                  const SizedBox(height: 40),
                  const Text(
                    'Actions recommandées',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildRecommendationCard(),
                  const SizedBox(height: 40),
                  _buildActionButtons(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      height: 250,
      width: double.infinity,
      color: AppTheme.dividerGrey,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.image, size: 64, color: AppTheme.textLight),
            SizedBox(height: 8),
            Text('Image du défaut capturée par l\'IA', style: TextStyle(color: AppTheme.textGrey)),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primaryBlue),
          const SizedBox(width: 12),
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(value),
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
      child: Text(recommendation, style: const TextStyle(height: 1.5)),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: const Text('Fermer'),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          flex: 2,
          child: ElevatedButton(
            onPressed: _isProcessing ? null : _processAnomaly,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.successGreen,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isProcessing
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Marquer comme résolue'),
          ),
        ),
      ],
    );
  }

  Future<void> _processAnomaly() async {
    setState(() => _isProcessing = true);
    // Simuler le traitement
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('L\'anomalie a été marquée comme résolue.')),
      );
      Navigator.pop(context);
    }
  }
}
