/// Modèle représentant un type d'anomalie dans le système ICEM (UML : typeAnomaly)
class TypeAnomaly {
  final String anomalyId;
  final String type;
  final String description;

  TypeAnomaly({
    required this.anomalyId,
    required this.type,
    required this.description,
  });

  /// Liste statique des types d'anomalies répertoriées dans le projet (visuelles et électriques)
  static final List<TypeAnomaly> _catalog = [
    // --- Anomalies du Contrôle Visuel (Codes de checklist_page.dart) ---
    TypeAnomaly(
      anomalyId: 'A',
      type: 'Cosse déformée',
      description: 'Cosse déformée détectée lors de l\'inspection visuelle.',
    ),
    TypeAnomaly(
      anomalyId: 'B',
      type: 'Cosse ébanchati',
      description: 'Cosse ébanchati détectée lors de l\'inspection visuelle.',
    ),
    TypeAnomaly(
      anomalyId: 'C',
      type: 'Cosse ouverte',
      description: 'Cosse ouverte détectée lors de l\'inspection visuelle.',
    ),
    TypeAnomaly(
      anomalyId: 'D',
      type: 'Fil pincé/coupé',
      description: 'Fil pincé ou coupé sur le faisceau.',
    ),
    TypeAnomaly(
      anomalyId: 'E',
      type: 'Fils inversés',
      description: 'Fils inversés dans le connecteur.',
    ),
    TypeAnomaly(
      anomalyId: 'F',
      type: 'Fil tendu',
      description: 'Fil trop tendu risquant de rompre.',
    ),
    TypeAnomaly(
      anomalyId: 'G',
      type: 'Fil sans cosse',
      description: 'Fil dénudé sans cosse sertie.',
    ),
    TypeAnomaly(
      anomalyId: 'H',
      type: 'Ticket élec. NC',
      description: 'Ticket de test électrique non conforme.',
    ),
    TypeAnomaly(
      anomalyId: 'I',
      type: 'Long./couleur NC',
      description: 'Longueur ou couleur de fil non conforme aux spécifications.',
    ),
    TypeAnomaly(
      anomalyId: 'J',
      type: 'Conn. cassé',
      description: 'Connecteur cassé ou endommagé.',
    ),
    TypeAnomaly(
      anomalyId: 'K',
      type: 'Bouchette manq.',
      description: 'Bouchette d\'étanchéité manquante.',
    ),
    TypeAnomaly(
      anomalyId: 'L',
      type: 'Tube thermo NC',
      description: 'Tube thermorétractable non conforme.',
    ),
    TypeAnomaly(
      anomalyId: 'M',
      type: 'Protection manq.',
      description: 'Gaine ou élément de protection manquant.',
    ),
    TypeAnomaly(
      anomalyId: 'N',
      type: 'Tube manqué',
      description: 'Tube manquant sur la dérivation.',
    ),
    TypeAnomaly(
      anomalyId: 'O',
      type: 'Vis mal serrée',
      description: 'Vis de serrage ou de fixation non conforme.',
    ),
    TypeAnomaly(
      anomalyId: 'P',
      type: 'Composant manq.',
      description: 'Composant d\'assemblage manquant.',
    ),
    TypeAnomaly(
      anomalyId: 'P_INS',
      type: 'Composant mal inséré',
      description: 'Composant d\'assemblage mal inséré dans le connecteur.',
    ),
    TypeAnomaly(
      anomalyId: 'Q',
      type: 'Fusible manq.',
      description: 'Fusible manquant sur la boîte.',
    ),
    TypeAnomaly(
      anomalyId: 'R',
      type: 'Gamme manq.',
      description: 'Gamme de fabrication manquante.',
    ),
    TypeAnomaly(
      anomalyId: 'S',
      type: 'Scotch mal exécuté',
      description: 'Scotchage ou rubanage mal appliqué.',
    ),
    TypeAnomaly(
      anomalyId: 'T',
      type: 'Mesure Dériv.',
      description: 'Mesure de la dérivation hors tolérance.',
    ),
    TypeAnomaly(
      anomalyId: 'V',
      type: 'Étiquette manquante',
      description: 'Étiquette d\'identification manquante.',
    ),
    TypeAnomaly(
      anomalyId: 'W',
      type: 'Étiquette inv.',
      description: 'Étiquette d\'identification inversée.',
    ),
    TypeAnomaly(
      anomalyId: 'Z',
      type: 'Autres défauts',
      description: 'Autre défaut visuel non spécifié.',
    ),

    // --- Anomalies du Contrôle Électrique (Codes de electrical_checklist_page.dart) ---
    TypeAnomaly(
      anomalyId: 'fmiC',
      type: 'FMI Conn.',
      description: 'Fil mal inséré sur le connecteur (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'fmiP',
      type: 'FMI Pos.',
      description: 'Fil mal inséré sur la position/alvéole (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'fiC',
      type: 'FI Conn.',
      description: 'Fil inversé sur le connecteur (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'fiP',
      type: 'FI Pos.',
      description: 'Fil inversé sur la position (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'fiMC',
      type: 'FI Mar/Coul',
      description: 'Fil inversé au niveau du marquage ou de la couleur (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'emC',
      type: 'Étiq. Manq.',
      description: 'Étiquette manquante sur le connecteur (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'eiC1',
      type: 'Étiq. Inv. C1',
      description: 'Étiquette inversée sur le connecteur 1 (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'eiC2',
      type: 'Étiq. Inv. C2',
      description: 'Étiquette inversée sur le connecteur 2 (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'cDer',
      type: 'Conn. Dériv.',
      description: 'Défaut de connecteur ou dérivation (Contrôle Électrique).',
    ),
    TypeAnomaly(
      anomalyId: 'pmC',
      type: 'Prot. Manq.',
      description: 'Protection manquante sur le connecteur (Contrôle Électrique).',
    ),
  ];

  /// Obtenir un type d'anomalie par son code
  static TypeAnomaly getByCode(String code) {
    return _catalog.firstWhere(
      (a) => a.anomalyId == code || a.type.toLowerCase() == code.toLowerCase(),
      orElse: () => TypeAnomaly(
        anomalyId: 'A00',
        type: 'Inconnu',
        description: 'Type d\'anomalie non répertorié.',
      ),
    );
  }

  /// Obtenir tous les types d'anomalies actifs
  static List<TypeAnomaly> getActiveType() {
    return _catalog;
  }
}

// Alias de type pour correspondre exactement à la casse du diagramme UML
typedef typeAnomaly = TypeAnomaly;
