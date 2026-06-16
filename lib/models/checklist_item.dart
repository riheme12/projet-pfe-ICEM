/// Modèle pour un point de contrôle dans la nouvelle Fiche de Contrôle Finale (FOR QUA 06)
class ChecklistItem {
  final String codeDefaut;
  final String numeroSerie;
  final String derivation;
  final String status;
  final String note;

  ChecklistItem({
    this.codeDefaut = '',
    this.numeroSerie = '',
    this.derivation = '',
    this.status = '',
    this.note = '',
  });

  // Alignement avec le diagramme de classe de conception (DCC)
  bool hasDefect() {
    return status.toUpperCase() == 'NOK' || status.toUpperCase() == 'NON CONFORME';
  }

  int defectsCount() {
    return hasDefect() ? 1 : 0;
  }

  void validateChecklist() {
    // Squelette de méthode pour le DCC
  }

  Map<String, dynamic> toMap() => {
        'codeDefaut': codeDefaut,
        'numeroSerie': numeroSerie,
        'derivation': derivation,
        'status': status,
        'note': note,
      };

  factory ChecklistItem.fromMap(Map<String, dynamic> map) {
    return ChecklistItem(
      codeDefaut: map['codeDefaut'] as String? ?? '',
      numeroSerie: map['numeroSerie'] as String? ?? '',
      derivation: map['derivation'] as String? ?? '',
      status: map['status'] as String? ?? '',
      note: map['note'] as String? ?? '',
    );
  }
}

// Alias de type pour l'alignement UML (DCC)
typedef visualchecklist = ChecklistItem;
