/// Modèle pour un point de contrôle dans une checklist visuelle ICEM
class ChecklistItem {
  final String code;  // Code ICEM : A, B, C, D, E, F, G, J, K, L, M, N, O, P, Q, R, S, V, W, Z
  final String label;
  ChecklistResult result;
  String? comment;

  ChecklistItem({
    this.code = '',
    required this.label,
    this.result = ChecklistResult.pending,
    this.comment,
  });

  Map<String, dynamic> toMap() => {
        'code': code,
        'label': label,
        'result': result.name,
        'comment': comment,
      };
}

/// Résultats possibles pour un point de contrôle
enum ChecklistResult {
  ok,
  nok,
  na,
  pending,
}

