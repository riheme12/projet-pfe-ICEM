import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/theme/app_theme.dart';

/// Page de scan QR Code — Mobile Friendly
class QrScannerPage extends StatefulWidget {
  final String? orderId;
  final String? orderReference;
  const QrScannerPage({super.key, this.orderId, this.orderReference});
  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> with SingleTickerProviderStateMixin {
  MobileScannerController? _controller;
  String? _scannedCode;
  bool _isFlashOn = false;
  bool _hasScanned = false;
  late AnimationController _animCtrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(detectionSpeed: DetectionSpeed.normal, facing: CameraFacing.back);
    _animCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _anim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _controller?.dispose(); _animCtrl.dispose(); super.dispose(); }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;
    final b = capture.barcodes.firstOrNull;
    if (b != null && b.rawValue != null) {
      setState(() { _scannedCode = b.rawValue; _hasScanned = true; });
      _controller?.stop();
      _showResult();
    }
  }

  void _showResult() {
    showModalBottomSheet(
      context: context, backgroundColor: Colors.transparent, isDismissible: false,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.borderGris, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppTheme.successGreen.withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(Icons.qr_code_scanner_rounded, color: AppTheme.successGreen, size: 32),
          ),
          const SizedBox(height: 16),
          Text('Code Détecté', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
          const SizedBox(height: 20),
          Container(
            width: double.infinity, padding: const EdgeInsets.all(16),
            decoration: AppTheme.cardDecoration(hasShadow: false),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('RÉFÉRENCE', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey, fontWeight: FontWeight.w800)),
              Text(_scannedCode ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.accentBlue)),
              if (widget.orderReference != null) ...[
                const SizedBox(height: 12),
                Text('ORDRE DE FABRICATION', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey, fontWeight: FontWeight.w800)),
                Text(widget.orderReference!, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              ],
            ]),
          ),
          const SizedBox(height: 24),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: () { Navigator.pop(ctx); _reset(); },
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: Text('RE-SCANNER', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13)))),
            const SizedBox(width: 12),
            Expanded(child: ElevatedButton(onPressed: () { Navigator.pop(ctx); Navigator.pop(context, _scannedCode); },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryNavy, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: Text('VALIDER', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13)))),
          ]),
          const SizedBox(height: 12),
        ]),
      ),
    );
  }

  void _reset() { setState(() { _scannedCode = null; _hasScanned = false; }); _controller?.start(); }

  void _manual() {
    final c = TextEditingController();
    showDialog(context: context, builder: (ctx) => AlertDialog(
      backgroundColor: Colors.white,
      title: Text('Saisie Manuelle', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 18)),
      content: TextField(
        controller: c, autofocus: true,
        decoration: const InputDecoration(hintText: 'Ex: CAB-001', prefixIcon: Icon(Icons.edit_note)),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
        ElevatedButton(onPressed: () { if (c.text.isNotEmpty) { Navigator.pop(ctx); Navigator.pop(context, c.text); } }, child: const Text('Valider')),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        MobileScanner(controller: _controller!, onDetect: _onDetect),
        _buildScanFrame(),
        _buildTopBar(),
        _buildBottomInfo(),
      ]),
    );
  }

  Widget _buildScanFrame() => Center(
    child: AnimatedBuilder(animation: _anim, builder: (_, __) => Container(
      width: 240, height: 240,
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.white.withOpacity(0.5), width: 2)),
      child: Stack(children: [
        Positioned(top: _anim.value * 220 + 10, left: 20, right: 20, child: Container(height: 2, decoration: BoxDecoration(boxShadow: [BoxShadow(color: AppTheme.accentCyan, blurRadius: 4)], color: AppTheme.accentCyan))),
      ]),
    )),
  );

  Widget _buildTopBar() => SafeArea(child: Padding(
    padding: const EdgeInsets.all(16),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded, color: Colors.white, size: 28)),
      IconButton(onPressed: () { setState(() => _isFlashOn = !_isFlashOn); _controller?.toggleTorch(); }, icon: Icon(_isFlashOn ? Icons.flash_on_rounded : Icons.flash_off_rounded, color: Colors.white, size: 28)),
    ]),
  ));

  Widget _buildBottomInfo() => Positioned(bottom: 60, left: 0, right: 0, child: Column(children: [
    Text('Visez le QR Code sur le câble', style: GoogleFonts.inter(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600)),
    const SizedBox(height: 24),
    TextButton.icon(onPressed: _manual, icon: const Icon(Icons.keyboard_rounded, color: Colors.white), label: const Text('SAISIE MANUELLE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1))),
  ]));
}
