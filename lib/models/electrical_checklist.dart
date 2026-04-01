import 'package:cloud_firestore/cloud_firestore.dart';

/// Une ligne de câble dans la fiche de contrôle électrique ICEM
/// Correspond à une ligne du tableau de la fiche papier
class CableDefectRow {
  String numeroSerie;

  // Fil mal Inséré
  String fmiConnecteur;
  String fmiPos;

  // Fil Inverti
  String fiConnecteur;
  String fiPos;
  String fiMarCoul;

  // Étiquette manquante
  String etiquetteManquanteConnecteur;

  // Étiquette Invertie
  String etiquetteInvertieConn1;
  String etiquetteInvertieConn2;

  // Connecteur / Dérivation
  String connecteurDerivation;

  // Protection manquante
  String protectionManquanteConnecteur;

  CableDefectRow({
    this.numeroSerie = '',
    this.fmiConnecteur = '',
    this.fmiPos = '',
    this.fiConnecteur = '',
    this.fiPos = '',
    this.fiMarCoul = '',
    this.etiquetteManquanteConnecteur = '',
    this.etiquetteInvertieConn1 = '',
    this.etiquetteInvertieConn2 = '',
    this.connecteurDerivation = '',
    this.protectionManquanteConnecteur = '',
  });

  bool get hasDefect =>
      fmiConnecteur.isNotEmpty ||
      fmiPos.isNotEmpty ||
      fiConnecteur.isNotEmpty ||
      fiPos.isNotEmpty ||
      fiMarCoul.isNotEmpty ||
      etiquetteManquanteConnecteur.isNotEmpty ||
      etiquetteInvertieConn1.isNotEmpty ||
      etiquetteInvertieConn2.isNotEmpty ||
      connecteurDerivation.isNotEmpty ||
      protectionManquanteConnecteur.isNotEmpty;

  Map<String, dynamic> toMap() => {
        'numeroSerie': numeroSerie,
        'fmiConnecteur': fmiConnecteur,
        'fmiPos': fmiPos,
        'fiConnecteur': fiConnecteur,
        'fiPos': fiPos,
        'fiMarCoul': fiMarCoul,
        'etiquetteManquanteConnecteur': etiquetteManquanteConnecteur,
        'etiquetteInvertieConn1': etiquetteInvertieConn1,
        'etiquetteInvertieConn2': etiquetteInvertieConn2,
        'connecteurDerivation': connecteurDerivation,
        'protectionManquanteConnecteur': protectionManquanteConnecteur,
      };

  factory CableDefectRow.fromMap(Map<String, dynamic> map) => CableDefectRow(
        numeroSerie: map['numeroSerie'] as String? ?? '',
        fmiConnecteur: map['fmiConnecteur'] as String? ?? '',
        fmiPos: map['fmiPos'] as String? ?? '',
        fiConnecteur: map['fiConnecteur'] as String? ?? '',
        fiPos: map['fiPos'] as String? ?? '',
        fiMarCoul: map['fiMarCoul'] as String? ?? '',
        etiquetteManquanteConnecteur:
            map['etiquetteManquanteConnecteur'] as String? ?? '',
        etiquetteInvertieConn1:
            map['etiquetteInvertieConn1'] as String? ?? '',
        etiquetteInvertieConn2:
            map['etiquetteInvertieConn2'] as String? ?? '',
        connecteurDerivation: map['connecteurDerivation'] as String? ?? '',
        protectionManquanteConnecteur:
            map['protectionManquanteConnecteur'] as String? ?? '',
      );
}

/// Modèle principal — Fiche de Contrôle Électrique ICEM
/// Collection Firestore : 'electrical_checklists'
class ElectricalChecklist {
  final String id;
  final String orderId;
  final String orderReference;

  // Header de la fiche
  final String ligneDeProd;
  final String matriculeOperateur;
  final String controleurId;
  final String controleurName;
  final DateTime date;
  final String codeCable;
  final String revision;
  final int quantiteCablesControles;

  // Lignes du tableau
  final List<CableDefectRow> cableRows;

  // Résumé
  final int nombreDefauts;
  final String signatureRespLigne;
  final String signatureRespQualite;
  final String status; // 'Conforme' | 'Non conforme'

  ElectricalChecklist({
    this.id = '',
    required this.orderId,
    required this.orderReference,
    this.ligneDeProd = '',
    this.matriculeOperateur = '',
    required this.controleurId,
    required this.controleurName,
    required this.date,
    this.codeCable = '',
    this.revision = '',
    this.quantiteCablesControles = 0,
    required this.cableRows,
    this.nombreDefauts = 0,
    this.signatureRespLigne = '',
    this.signatureRespQualite = '',
    required this.status,
  });

  factory ElectricalChecklist.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ElectricalChecklist(
      id: doc.id,
      orderId: data['orderId'] as String? ?? '',
      orderReference: data['orderReference'] as String? ?? '',
      ligneDeProd: data['ligneDeProd'] as String? ?? '',
      matriculeOperateur: data['matriculeOperateur'] as String? ?? '',
      controleurId: data['controleurId'] as String? ?? '',
      controleurName: data['controleurName'] as String? ?? '',
      date: data['date'] != null
          ? (data['date'] as Timestamp).toDate()
          : DateTime.now(),
      codeCable: data['codeCable'] as String? ?? '',
      revision: data['revision'] as String? ?? '',
      quantiteCablesControles: data['quantiteCablesControles'] as int? ?? 0,
      cableRows: (data['cableRows'] as List<dynamic>?)
              ?.map((e) => CableDefectRow.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      nombreDefauts: data['nombreDefauts'] as int? ?? 0,
      signatureRespLigne: data['signatureRespLigne'] as String? ?? '',
      signatureRespQualite: data['signatureRespQualite'] as String? ?? '',
      status: data['status'] as String? ?? 'En attente',
    );
  }

  Map<String, dynamic> toFirestore() => {
        'orderId': orderId,
        'orderReference': orderReference,
        'ligneDeProd': ligneDeProd,
        'matriculeOperateur': matriculeOperateur,
        'controleurId': controleurId,
        'controleurName': controleurName,
        'date': Timestamp.fromDate(date),
        'codeCable': codeCable,
        'revision': revision,
        'quantiteCablesControles': quantiteCablesControles,
        'cableRows': cableRows.map((r) => r.toMap()).toList(),
        'nombreDefauts': nombreDefauts,
        'signatureRespLigne': signatureRespLigne,
        'signatureRespQualite': signatureRespQualite,
        'status': status,
      };
}
