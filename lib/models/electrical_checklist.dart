import 'package:cloud_firestore/cloud_firestore.dart';

class ElectricalChecklist {
  final String id;
  final String orderId;
  final String orderReference;
  final String ligneDeProd;
  final String matriculeOperateur;
  final String controleurId;
  final String controleurName;
  final DateTime date;
  final String codeCable;
  final String revision;
  final int nombreDefauts;
  final String signatureRespLigne;
  final String signatureRespQualite;
  final String status;
  final String comment;

  // Fil mal Inséré
  final String fmiConnecteur;
  final String fmiPos;

  // Fil Inverti
  final String fiConnecteur;
  final String fiPos;
  final String fiMarCoul;

  // Étiquette manquante
  final String etiquetteManquanteConnecteur;

  // Étiquette Invertie
  final String etiquetteInvertieConn1;
  final String etiquetteInvertieConn2;

  // Connecteur / Dérivation
  final String connecteurDerivation;

  // Protection manquante
  final String protectionManquanteConnecteur;

  ElectricalChecklist({
    this.id = '',
    required this.orderId,
    required this.orderReference,
    this.ligneDeProd = '',
    this.matriculeOperateur = '',
    required this.controleurId,
    required this.controleurName,
    required this.date,
    required this.codeCable,
    this.revision = '',
    this.nombreDefauts = 0,
    this.signatureRespLigne = '',
    this.signatureRespQualite = '',
    required this.status,
    this.comment = '',
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

  List<String> get defectLabels {
    final labels = <String>[];
    if (fmiConnecteur.isNotEmpty || fmiPos.isNotEmpty) labels.add('Fil mal Inséré');
    if (fiConnecteur.isNotEmpty || fiPos.isNotEmpty || fiMarCoul.isNotEmpty) labels.add('Fil Inverti');
    if (etiquetteManquanteConnecteur.isNotEmpty) labels.add('Étiquette manquante');
    if (etiquetteInvertieConn1.isNotEmpty || etiquetteInvertieConn2.isNotEmpty) labels.add('Étiquette Invertie');
    if (connecteurDerivation.isNotEmpty) labels.add('Connecteur / Dérivation');
    if (protectionManquanteConnecteur.isNotEmpty) labels.add('Protection manquante');
    return labels;
  }

  // Alignement avec le diagramme de classe de conception (DCC)
  List<String> getDefectedLabels() {
    return defectLabels;
  }

  void validateChecklist() {
    // Squelette de méthode pour le DCC
  }

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
      date: data['date'] != null ? (data['date'] as Timestamp).toDate() : DateTime.now(),
      codeCable: data['codeCable'] as String? ?? data['numeroSerie'] as String? ?? '',
      revision: data['revision'] as String? ?? '',
      nombreDefauts: data['nombreDefauts'] as int? ?? 0,
      signatureRespLigne: data['signatureRespLigne'] as String? ?? '',
      signatureRespQualite: data['signatureRespQualite'] as String? ?? '',
      status: data['status'] as String? ?? 'En attente',
      comment: data['comment'] as String? ?? '',
      fmiConnecteur: data['fmiConnecteur'] as String? ?? '',
      fmiPos: data['fmiPos'] as String? ?? '',
      fiConnecteur: data['fiConnecteur'] as String? ?? '',
      fiPos: data['fiPos'] as String? ?? '',
      fiMarCoul: data['fiMarCoul'] as String? ?? '',
      etiquetteManquanteConnecteur: data['etiquetteManquanteConnecteur'] as String? ?? '',
      etiquetteInvertieConn1: data['etiquetteInvertieConn1'] as String? ?? '',
      etiquetteInvertieConn2: data['etiquetteInvertieConn2'] as String? ?? '',
      connecteurDerivation: data['connecteurDerivation'] as String? ?? '',
      protectionManquanteConnecteur: data['protectionManquanteConnecteur'] as String? ?? '',
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
        'nombreDefauts': nombreDefauts,
        'signatureRespLigne': signatureRespLigne,
        'signatureRespQualite': signatureRespQualite,
        'status': status,
        'comment': comment,
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
}
