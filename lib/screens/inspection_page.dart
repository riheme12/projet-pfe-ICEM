import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:path/path.dart' as path;
import 'package:projeticem/screens/checklist_page.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/services/anomaly_service.dart';
import 'dart:async';
import 'dart:math';
import 'dart:io';
import 'dart:convert';
import 'package:provider/provider.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/services/roboflow_service.dart';
import 'package:projeticem/screens/anomaly_detail_page.dart';

/// Page d'inspection IA — Dark Premium
/// Alignée avec le design Corporate Intelligence Suite
class InspectionPage extends StatefulWidget {
  final String? orderId;
  final String? orderReference;
  final String? cableReference;

  const InspectionPage({
    super.key,
    this.orderId,
    this.orderReference,
    this.cableReference,
  });

  @override
  State<InspectionPage> createState() => _InspectionPageState();
}

class _InspectionPageState extends State<InspectionPage> with SingleTickerProviderStateMixin {
  CameraController? _controller;
  bool _isCameraReady = false;
  int _partsInspectedCount = 0;
  bool _isProcessing = false;
  bool _showResult = false;
  Map<String, dynamic>? _stepResult;
  late AnimationController _pulseCtrl;

  final RoboflowService _roboflowService = RoboflowService();
  bool _useRealAI = true;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _handleCameraError('Aucune caméra détectée.');
        return;
      }
      _controller = CameraController(cameras.first, ResolutionPreset.medium, enableAudio: false, imageFormatGroup: ImageFormatGroup.jpeg);
      await _controller!.initialize();
      if (mounted) setState(() => _isCameraReady = true);
    } catch (e) {
      _handleCameraError('Erreur caméra: $e');
    }
  }

  void _handleCameraError(String message) {
    if (mounted) {
      setState(() => _isCameraReady = true);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: AppTheme.errorRed));
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _controller?.dispose();
    super.dispose();
  }

  void _captureImage() async {
    if (_isProcessing || _showResult) return;
    setState(() => _isProcessing = true);

    try {
      Map<String, dynamic> result;
      if (_useRealAI && _controller != null && _controller!.value.isInitialized) {
        final xFile = await _controller!.takePicture();
        final bytes = await File(xFile.path).readAsBytes();
        final String base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        
        result = await _roboflowService.analyzeImage(context, xFile.path);
        if (result['status'] == 'NOK') await _saveAnomaly(result, imageUrl: base64Image);
        result['imageUrl'] = base64Image;
        try { await File(xFile.path).delete(); } catch (_) {}
      } else {
        await Future.delayed(const Duration(milliseconds: 1500));
        result = _generateSimulatedResult();
        if (result['status'] == 'NOK') await _saveAnomaly(result);
      }

      if (mounted) {
        setState(() {
          _isProcessing = false;
          _showResult = true;
          _stepResult = result;
          _partsInspectedCount++;
        });
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e'), backgroundColor: AppTheme.errorRed));
    }
  }

  Future<void> _saveAnomaly(Map<String, dynamic> result, {String? imageUrl}) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.currentUser;
    final anomaly = Anomaly(
      id: '',
      type: result['label'] ?? 'Défaut IA',
      severity: result['severity'] ?? 'Majeur',
      confidence: (result['confidence'] as num?)?.toDouble() ?? 0.0,
      location: 'Zone #${_partsInspectedCount + 1}',
      cableId: widget.cableReference ?? 'N/A',
      detectedAt: DateTime.now(),
      technicianId: user?.id,
      technicianName: user?.fullName,
      imageUrl: imageUrl,
      statut: 'detectee',
      orderId: widget.orderId,
    );
    await AnomalyService().createAnomaly(anomaly);
  }

  void _next() async {
    setState(() { _showResult = false; _stepResult = null; });
    try { await _controller?.resumePreview(); } catch (_) {}
  }

  void _finish() async {
    setState(() => _isProcessing = true);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
        const SizedBox(width: 15),
        Text('Finalisation de l\'inspection...', style: GoogleFonts.inter()),
      ]),
      backgroundColor: AppTheme.accentBlue,
    ));

    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;

    final List<dynamic> anoms = _stepResult?['anomalies'] ?? [];
    final codes = anoms.map((a) => a['code'] as String).toList();

    final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => ChecklistPage(
      orderId: widget.orderId,
      orderReference: widget.orderReference,
      cableReference: widget.cableReference,
      serialNumber: widget.cableReference,
      detectedDefects: codes,
      imageUrl: _stepResult?['imageUrl'],
    )));

    if (!mounted) return;

    if (result != null && result['anomaly'] != null) {
      // Ouvrir directement le détail de l'anomalie pour correction
      await Navigator.push(context, MaterialPageRoute(builder: (_) => AnomalyDetailPage(anomaly: result['anomaly'])));
    }

    Navigator.pop(context, result);
  }

  Map<String, dynamic> _generateSimulatedResult() {
    final random = Random();
    final ok = random.nextDouble() > 0.3;
    return {
      'status': ok ? 'OK' : 'NOK',
      'label': ok ? 'Conforme' : 'Rayure détectée',
      'confidence': 0.7 + (random.nextDouble() * 0.25),
      'severity': 'Majeur',
    };
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCameraReady) return Scaffold(backgroundColor: AppTheme.darkBg, body: const Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(fit: StackFit.expand, children: [
        _controller != null && _controller!.value.isInitialized ? CameraPreview(_controller!) : Container(color: AppTheme.darkBg),
        
        _buildUIOverlay(),
        
        _buildTopBar(),
        if (widget.cableReference != null) _buildCableInfo(),
        
        _buildBottomPanel(),
      ]),
    );
  }

  Widget _buildUIOverlay() {
    if (_showResult && _stepResult != null) return _buildResultOverlay();
    return Center(
      child: AnimatedBuilder(
        animation: _pulseCtrl,
        builder: (_, child) => Container(
          width: 280, height: 280,
          decoration: BoxDecoration(
            border: Border.all(color: AppTheme.accentCyan.withOpacity(0.3 + (_pulseCtrl.value * 0.4)), width: 2),
            borderRadius: BorderRadius.circular(24),
          ),
          child: _isProcessing ? const Center(child: CircularProgressIndicator(color: AppTheme.accentCyan)) : child,
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.filter_center_focus_rounded, color: AppTheme.accentCyan.withOpacity(0.5), size: 40),
          const SizedBox(height: 8),
          Text('ALIGNER LE COMPOSANT', style: GoogleFonts.inter(color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1)),
        ]),
      ),
    );
  }

  Widget _buildResultOverlay() {
    final ok = _stepResult!['status'] == 'OK';
    final color = ok ? AppTheme.successGreen : AppTheme.errorRed;
    return Center(
      child: Container(
        width: 280, height: 280,
        decoration: BoxDecoration(
          border: Border.all(color: color, width: 3),
          borderRadius: BorderRadius.circular(24),
          color: color.withOpacity(0.1),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
          Container(
            width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20))),
            child: Text(
              ok ? 'CONFORME ✓' : '${_stepResult!['label'].toString().toUpperCase()} ⚠️',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildTopBar() => Positioned(
    top: 0, left: 0, right: 0,
    child: Container(
      padding: const EdgeInsets.fromLTRB(16, 50, 16, 20),
      decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black.withOpacity(0.8), Colors.transparent])),
      child: Row(children: [
        IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20), onPressed: () => Navigator.pop(context)),
        Expanded(child: Column(children: [
          Text('INSPECTION IA EN DIRECT', style: GoogleFonts.inter(color: AppTheme.accentCyan, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 2)),
          Text('COMPOSANT ${_partsInspectedCount + 1}', style: GoogleFonts.inter(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
        ])),
        const SizedBox(width: 48),
      ]),
    ),
  );

  Widget _buildCableInfo() => Positioned(
    top: 110, left: 20, right: 20,
    child: Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: AppTheme.glassCard(radius: 12),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.cable_rounded, color: AppTheme.accentCyan, size: 14),
          const SizedBox(width: 8),
          Text('Câble: ${widget.cableReference}', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
        ]),
      ),
    ),
  );

  Widget _buildBottomPanel() => Positioned(
    bottom: 0, left: 0, right: 0,
    child: Container(
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 40),
      decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [Colors.black.withOpacity(0.9), Colors.transparent])),
      child: Column(children: [
        if (_partsInspectedCount > 0) Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.analytics_outlined, color: AppTheme.accentCyan, size: 16),
            const SizedBox(width: 8),
            Text('$_partsInspectedCount composant(s) validé(s)', style: GoogleFonts.inter(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
          ]),
        ),

        if (!_showResult && !_isProcessing) GestureDetector(
          onTap: _captureImage,
          child: Container(
            width: 76, height: 76,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 4)),
            child: Container(margin: const EdgeInsets.all(6), decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
          ),
        )
        else if (_isProcessing) const SizedBox(height: 76, child: Center(child: CircularProgressIndicator(color: AppTheme.accentCyan)))
        else Column(children: [
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _next,
            icon: const Icon(Icons.add_a_photo_rounded),
            label: Text('INSPECTER LE SUIVANT', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
          )),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: OutlinedButton.icon(
            onPressed: _finish,
            icon: const Icon(Icons.check_circle_rounded),
            label: Text('TERMINER L\'INSPECTION', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Colors.white38, width: 2), padding: const EdgeInsets.symmetric(vertical: 18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
          )),
        ]),
      ]),
    ),
  );
}
