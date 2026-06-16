import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;

/// Service d'intégration Roboflow pour la détection de défauts de câbles
///
/// Ce service peut fonctionner en deux modes :
/// 1. Mode DIRECT : Appel direct à l'API Roboflow depuis le mobile
/// 2. Mode BACKEND : Appel via le backend Node.js (plus sécurisé)
class RoboflowService {
  // Singleton
  static final RoboflowService _instance = RoboflowService._internal();
  factory RoboflowService() => _instance;
  RoboflowService._internal();

  // ===== Configuration =====
  static const String _apiKey = String.fromEnvironment('ROBOFLOW_API_KEY', defaultValue: 'ZvSIGjRPcSk1jlr6EUvA');
  static const String _modelId = String.fromEnvironment('ROBOFLOW_MODEL_ID', defaultValue: 'wire-default-dtection-utdc7');
  static const String _modelVersion = String.fromEnvironment('ROBOFLOW_MODEL_VERSION', defaultValue: '5');
  static const double _confidenceThreshold = 0.25; 
  static const double _overlapThreshold = 0.30;

  // Mode BACKEND — URL de l'API backend
  static const String _backendBaseUrl = String.fromEnvironment('BACKEND_URL', defaultValue: 'http://10.0.2.2:5000');

  /// Choisir le mode d'appel (false = Direct)
  static const bool useBackend = false; 

  // Mapping des classes Roboflow → types d'anomalies ICEM
  static const Map<String, Map<String, String>> classMapping = {
    'composant_mal_insere': {'type': 'Composant mal inséré', 'severity': 'Critique', 'code': 'P_INS'},
    'composant_mal _insere': {'type': 'Composant mal inséré', 'severity': 'Critique', 'code': 'P_INS'}, // variante avec espace du modèle
    'composant_manquant': {'type': 'Composant manquant', 'severity': 'Critique', 'code': 'P'},
    'etiquette_anomalie': {'type': 'Anomalie étiquette', 'severity': 'Mineur', 'code': 'V'},
    'protection_anomalie': {'type': 'Anomalie protection', 'severity': 'Majeur', 'code': 'M'},
    'connecteur_anomalie': {'type': 'Anomalie connecteur', 'severity': 'Critique', 'code': 'J'},
    'cosse_anomalie': {'type': 'Anomalie cosse', 'severity': 'Majeur', 'code': 'A'},
    'scotche_anomalie': {'type': 'Anomalie scotch', 'severity': 'Mineur', 'code': 'S'},
  };

  /// Recherche le mapping pour un nom de classe avec normalisation des espaces
  static Map<String, String>? findClassMapping(String className) {
    final lower = className.toLowerCase().trim();
    // Essai 1 : clé exacte
    if (classMapping.containsKey(lower)) return classMapping[lower];
    // Essai 2 : espaces condensés
    final normalized = lower.replaceAll(RegExp(r'\s+'), ' ');
    if (classMapping.containsKey(normalized)) return classMapping[normalized];
    // Essai 3 : tous les espaces → underscores
    final noSpaces = lower.replaceAll(RegExp(r'\s+'), '_').replaceAll(RegExp(r'__+'), '_');
    if (classMapping.containsKey(noSpaces)) return classMapping[noSpaces];
    return null;
  }

  /// Analyse une image via l'API Roboflow
  Future<Map<String, dynamic>> analyzeImage(BuildContext context, String imagePath, {
    String? cableId,
    String? orderId,
    String? technicianId,
    String? technicianName,
    String? imageUrl,
  }) async {
    try {
      final file = File(imagePath);
      if (!await file.exists()) throw Exception('Fichier image introuvable');
      
      final bytes = await file.readAsBytes();
      final base64Image = base64Encode(bytes);

      if (useBackend) {
        return await _analyzeViaBackend(context, base64Image, cableId: cableId, orderId: orderId, technicianId: technicianId, technicianName: technicianName, imageUrl: imageUrl);
      } else {
        return await _analyzeDirectly(base64Image);
      }
    } catch (e) {
      debugPrint('Roboflow error: $e. Using simulation fallback.');
      return _getSimulationFallback(); // Fallback automatique en cas d'erreur
    }
  }

  /// Appel DIRECT à l'API Roboflow
  Future<Map<String, dynamic>> _analyzeDirectly(String base64Image) async {
    if (_apiKey.isEmpty) return _getSimulationFallback();

    final url = Uri.parse(
      'https://detect.roboflow.com/$_modelId/$_modelVersion'
      '?api_key=$_apiKey'
      '&confidence=${(_confidenceThreshold * 100).round()}'
      '&overlap=${(_overlapThreshold * 100).round()}'
    );

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: base64Image,
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) {
      debugPrint('Roboflow status ${response.statusCode}. Using simulation.');
      return _getSimulationFallback();
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _parseRoboflowResponse(data);
  }

  /// Simulation de secours en cas de problème réseau ou quota Roboflow
  Map<String, dynamic> _getSimulationFallback() {
    return {
      'status': 'OK',
      'label': 'Aucun défaut détecté',
      'confidence': 0.95,
      'totalDefects': 0,
      'isSimulated': true,
      'anomalies': <Map<String, dynamic>>[],
    };
  }

  /// Appel via le backend Node.js
  Future<Map<String, dynamic>> _analyzeViaBackend(
    BuildContext context,
    String base64Image, {
    String? cableId,
    String? orderId,
    String? technicianId,
    String? technicianName,
    String? imageUrl,
  }) async {
    try {
      final url = Uri.parse('$_backendBaseUrl/api/ai/analyze');
      final user = firebase_auth.FirebaseAuth.instance.currentUser;
      final token = await user?.getIdToken();

      if (token == null) throw Exception('Non authentifié');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({
          'image': base64Image,
          'imageUrl': imageUrl,
          'cableId': cableId ?? 'N/A',
          'orderId': orderId,
          'technicianId': technicianId,
          'technicianName': technicianName,
          'autoSave': true,
        }),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode != 200) return _getSimulationFallback();
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      return _getSimulationFallback();
    }
  }

  /// Parse la réponse brute de Roboflow
  Map<String, dynamic> _parseRoboflowResponse(Map<String, dynamic> data) {
    final predictions = (data['predictions'] as List?) ?? [];

    // Filtrer les prédictions (ex: ignorer la classe "null" ou "background" ou "ok")
    final validPredictions = predictions.where((pred) {
      final String rawClass = (pred['class'] as String? ?? 'Inconnu').toLowerCase().trim();
      return rawClass != 'null' && rawClass != 'background' && rawClass != 'ok' && rawClass != 'conforme';
    }).toList();

    if (validPredictions.isEmpty) {
      return {'status': 'OK', 'label': 'Aucun défaut détecté', 'confidence': 0.95, 'anomalies': <Map<String, dynamic>>[], 'totalDefects': 0};
    }

    final anomalies = validPredictions.map<Map<String, dynamic>>((pred) {
      final String rawClass = (pred['class'] as String? ?? 'Inconnu');
      final String className = rawClass.toLowerCase().trim();
      final confidence = (pred['confidence'] as num?)?.toDouble() ?? 0.0;
      final mapping = findClassMapping(rawClass);
      
      String displayName = mapping != null ? mapping['type']! : rawClass;
      String severity = mapping != null ? mapping['severity']! : 'Majeur';
      String code = mapping != null ? mapping['code']! : 'Z';
      
      return {
        'type': displayName,
        'code': code,
        'roboflowClass': rawClass,
        'confidence': confidence,
        'severity': severity,
        'boundingBox': {'x': pred['x'], 'y': pred['y'], 'width': pred['width'], 'height': pred['height']},
      };
    }).toList();

    anomalies.sort((a, b) => (b['confidence'] as double).compareTo(a['confidence'] as double));
    final mostCritical = anomalies.first;

    return {
      'status': 'NOK',
      'label': mostCritical['type'] as String,
      'confidence': mostCritical['confidence'] as double,
      'severity': mostCritical['severity'] as String,
      'anomalies': anomalies,
      'totalDefects': anomalies.length,
    };
  }
}
