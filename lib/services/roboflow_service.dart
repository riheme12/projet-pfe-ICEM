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
  static const String _apiKey = 'ZvSIGjRPcSk1jlr6EUvA'; 
  static const String _modelId = 'wire-default-dtection-utdc7';
  static const String _modelVersion = '2';
  static const double _confidenceThreshold = 0.25; 
  static const double _overlapThreshold = 0.30;

  // Mode BACKEND (Utilisez l'URL Ngrok pour un accès garanti)
  // Exemple: 'https://abcd-1234.ngrok-free.app'
  static const String _backendBaseUrl = 'METTRE_TON_URL_NGROK_ICI'; 

  /// Choisir le mode d'appel (false = Direct, plus simple)
  static const bool useBackend = false; 

  // ===== Mapping des classes Roboflow → types d'anomalies ICEM =====
  static const Map<String, Map<String, String>> classMapping = {
    'composant_mal_insere': {'type': 'Composant mal inséré', 'severity': 'Critique', 'code': 'P'},
    'composant_manquant': {'type': 'Composant manquant', 'severity': 'Critique', 'code': 'P'},
    'etiquette_anomalie': {'type': 'Anomalie étiquette', 'severity': 'Mineur', 'code': 'V'},
    'protection_anomalie': {'type': 'Anomalie protection', 'severity': 'Majeur', 'code': 'M'},
    'connecteur_anomalie': {'type': 'Anomalie connecteur', 'severity': 'Critique', 'code': 'J'},
    'cosse_anomalie': {'type': 'Anomalie cosse', 'severity': 'Majeur', 'code': 'A'},
    'scotche_anomalie': {'type': 'Anomalie scotch', 'severity': 'Mineur', 'code': 'S'},
  };

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
      if (!await file.exists()) {
        throw Exception('Fichier image introuvable: $imagePath');
      }
      final bytes = await file.readAsBytes();
      final base64Image = base64Encode(bytes);

      if (useBackend) {
        return await _analyzeViaBackend(
          context,
          base64Image,
          cableId: cableId,
          orderId: orderId,
          technicianId: technicianId,
          technicianName: technicianName,
          imageUrl: imageUrl,
        );
      } else {
        return await _analyzeDirectly(base64Image);
      }
    } catch (e) {
      debugPrint('RoboflowService error: $e');
      rethrow;
    }
  }

  /// Appel DIRECT à l'API Roboflow
  Future<Map<String, dynamic>> _analyzeDirectly(String base64Image) async {
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
    ).timeout(const Duration(seconds: 60));

    if (response.statusCode != 200) {
      throw Exception('Erreur Roboflow API: ${response.statusCode} — ${response.body}');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return _parseRoboflowResponse(data);
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
    final url = Uri.parse('$_backendBaseUrl/api/ai/analyze');
    debugPrint('Calling AI Backend: $url');
    
    // Récupérer le token Firebase Auth directement
    final user = firebase_auth.FirebaseAuth.instance.currentUser;
    final token = await user?.getIdToken();

    if (token == null) {
      throw Exception('Utilisateur non authentifié : impossible de récupérer le token.');
    }

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'image': base64Image,
        'imageUrl': imageUrl,
        'cableId': cableId ?? 'N/A',
        'orderId': orderId,
        'technicianId': technicianId,
        'technicianName': technicianName,
        'autoSave': true,
      }),
    ).timeout(const Duration(seconds: 60));

    if (response.statusCode != 200) {
      throw Exception('Erreur backend AI: ${response.statusCode} — ${response.body}');
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Parse la réponse brute de Roboflow
  Map<String, dynamic> _parseRoboflowResponse(Map<String, dynamic> data) {
    final predictions = (data['predictions'] as List?) ?? [];

    if (predictions.isEmpty) {
      return {
        'status': 'OK',
        'label': 'Aucun défaut détecté',
        'confidence': 0.95,
        'anomalies': <Map<String, dynamic>>[],
        'totalDefects': 0,
      };
    }

    final anomalies = predictions.map<Map<String, dynamic>>((pred) {
      final String rawClass = (pred['class'] as String? ?? 'Inconnu');
      final String className = rawClass.toLowerCase().trim();
      final confidence = (pred['confidence'] as num?)?.toDouble() ?? 0.0;
      
      final mapping = classMapping[className];
      
      String displayName = mapping != null ? mapping['type']! : rawClass;
      String severity = mapping != null ? mapping['severity']! : 'Majeur';
      String code = mapping != null ? mapping['code']! : 'Z';
      
      if (confidence >= 0.90) severity = 'Critique';
      if (confidence < 0.40) severity = 'Mineur';

      return {
        'type': displayName,
        'code': code,
        'roboflowClass': rawClass,
        'confidence': confidence,
        'severity': severity,
        'boundingBox': {
          'x': pred['x'],
          'y': pred['y'],
          'width': pred['width'],
          'height': pred['height'],
        },
      };
    }).toList();

    const severityOrder = {'Critique': 3, 'Majeur': 2, 'Mineur': 1};
    anomalies.sort((a, b) {
      final aScore = severityOrder[a['severity']] ?? 0;
      final bScore = severityOrder[b['severity']] ?? 0;
      return bScore.compareTo(aScore);
    });

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

  /// Teste la connexion
  Future<bool> testConnection() async {
    try {
      if (useBackend) {
        final url = Uri.parse('$_backendBaseUrl/api/ai/config');
        final response = await http.get(url).timeout(const Duration(seconds: 5));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          return data['isConfigured'] == true;
        }
        return false;
      } else {
        return _apiKey.isNotEmpty;
      }
    } catch (e) {
      debugPrint('Roboflow connection test failed: $e');
      return false;
    }
  }
}
