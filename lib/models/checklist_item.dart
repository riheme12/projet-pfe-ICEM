/// Modèle pour un point de contrôle dans une checklist
class ChecklistItem {
  final String label;
  ChecklistResult result;
  String? comment;

  ChecklistItem({
    required this.label,
    this.result = ChecklistResult.pending,
    this.comment,
  });
}

/// Résultats possibles pour un point de contrôle
enum ChecklistResult {
  ok,
  nok,
  na,
  pending,
}
