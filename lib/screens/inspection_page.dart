import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/checklist_page.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';

/// Page d'inspection simulant le flux camera avec des overlays IA
/// Reçoit les données du câble scanné (orderId, cableReference) pour le pipeline
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

class _InspectionPageState extends State<InspectionPage> {
  CameraController? _controller;
  bool _isCameraReady = false;
  bool _isDetecting = false;
  List<Map<String, dynamic>> _detections = [];
  Timer? _detectionTimer;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _handleCameraError('Aucune caméra détectée. Passage en mode simulation.');
        return;
      }

      _controller = CameraController(
        cameras.first,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      if (mounted) {
        setState(() {
          _isCameraReady = true;
        });
        _startSimulation();
      }
    } catch (e) {
      debugPrint('Camera error: $e');
      _handleCameraError('Erreur caméra: $e');
    }
  }

  void _handleCameraError(String message) {
    debugPrint('Handling camera error: $message');
    if (mounted) {
      setState(() {
        _isCameraReady = true;
      });
      
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.orange.shade800,
              duration: const Duration(seconds: 4),
              action: SnackBarAction(
                label: 'OK',
                textColor: Colors.white,
                onPressed: () {},
              ),
            ),
          );
        }
      });
      
      _startSimulation();
    }
  }

  void _startSimulation() {
    _detectionTimer = Timer.periodic(const Duration(milliseconds: 1500), (timer) {
      if (mounted) {
        setState(() {
          _isDetecting = !_isDetecting;
          if (_isDetecting) {
            _detections = [
              {
                'rect': Rect.fromLTWH(100, 200, 150, 80),
                'label': 'Défaut surface',
                'confidence': 0.92,
              },
              if (timer.tick % 3 == 0)
                {
                  'rect': Rect.fromLTWH(50, 400, 100, 50),
                  'label': 'Rayure',
                  'confidence': 0.85,
                }
            ];
          } else {
            _detections = [];
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _detectionTimer?.cancel();
    _controller?.dispose();
    super.dispose();
  }

  /// Capturer et passer aux checklists avec les données du câble
  void _captureAndProceed() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Image capturée ! Passage aux checklists...')),
    );
    
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => ChecklistPage(
          orderId: widget.orderId,
          orderReference: widget.orderReference,
          cableReference: widget.cableReference,
        ),
      ),
    );

    // Retourner le résultat à OrderDetailPage
    if (mounted && result != null) {
      Navigator.pop(context, result);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCameraReady) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: Colors.white),
              const SizedBox(height: 16),
              const Text('Initialisation de la caméra...', style: TextStyle(color: Colors.white)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _initializeCamera,
                child: const Text('Réessayer'),
              ),
              TextButton(
                onPressed: () => _handleCameraError('Mode simulation activé manuellement.'),
                child: const Text('Passer en simulation', style: TextStyle(color: Colors.white70)),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          _controller != null && _controller!.value.isInitialized
              ? CameraPreview(_controller!)
              : Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0xFF0D1B2A),
                        Color(0xFF1B2F4A),
                        Color(0xFF0D1B2A),
                      ],
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.1),
                              width: 2,
                            ),
                          ),
                          child: Icon(
                            Icons.videocam_outlined,
                            size: 56,
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'MODE SIMULATION',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Caméra non disponible',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
          _buildGuidageOverlay(),
          _buildDetectionOverlays(),
          _buildBottomControls(),
          _buildTopBar(),
          // Cable info bar
          if (widget.cableReference != null)
            _buildCableInfoBar(),
        ],
      ),
    );
  }

  /// Barre d'info du câble en cours d'inspection
  Widget _buildCableInfoBar() {
    return Positioned(
      top: 90,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.primaryBlue.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.qr_code_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Câble: ${widget.cableReference}',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (widget.orderReference != null)
                    Text(
                      'Ordre: ${widget.orderReference}',
                      style: GoogleFonts.inter(
                        color: Colors.white70,
                        fontSize: 11,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuidageOverlay() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: _isDetecting ? AppTheme.successGreen : Colors.white.withValues(alpha: 0.5),
          width: 2,
        ),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 40, vertical: 150),
      child: Stack(
        children: [
          if (!_isDetecting)
            const Center(
              child: Text(
                'Aligner le câble ici',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDetectionOverlays() {
    return Stack(
      children: _detections.map((det) {
        final rect = det['rect'] as Rect;
        return Positioned(
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.errorRed, width: 2),
            ),
            child: Align(
              alignment: Alignment.topLeft,
              child: Container(
                color: AppTheme.errorRed,
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Text(
                  '${det['label']} ${(det['confidence'] * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTopBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.only(top: 40, bottom: 20, left: 16, right: 16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.black.withValues(alpha: 0.7), Colors.transparent],
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            const Text(
              'INSPECTION IA EN DIRECT',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2),
            ),
            const SizedBox(width: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [Colors.black.withValues(alpha: 0.7), Colors.transparent],
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
              ),
              child: InkWell(
                onTap: _captureAndProceed,
                child: Container(
                  margin: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
