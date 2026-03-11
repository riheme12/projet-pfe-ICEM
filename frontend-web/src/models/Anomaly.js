/**
 * Modèle représentant une anomalie détectée par l'IA
 * Synchronisé avec lib/models/anomaly.dart (mobile)
 */
export class Anomaly {
    constructor({ id, type, severity, confidence, location = null, cableId, detectedAt }) {
        this.id = id;
        this.type = type;                // 'Rayure', 'Déformation', 'Défaut de surface', etc.
        this.severity = severity;        // 'Mineur', 'Majeur', 'Critique'
        this.confidence = confidence;    // Score de confiance IA (0.0 - 1.0)
        this.location = location;        // Description de la localisation
        this.cableId = cableId;          // ID du câble concerné
        this.detectedAt = detectedAt instanceof Date ? detectedAt : new Date(detectedAt || Date.now());
    }

    get severityColor() {
        switch (this.severity) {
            case 'Critique': return 'red';
            case 'Majeur': return 'orange';
            case 'Mineur': return 'yellow';
            default: return 'grey';
        }
    }

    get isCritical() {
        return this.severity === 'Critique';
    }

    static fromJson(json) {
        return new Anomaly({
            id: json.id,
            type: json.type,
            severity: json.severity,
            confidence: Number(json.confidence),
            location: json.location || null,
            cableId: json.cableId,
            detectedAt: json.detectedAt ? new Date(json.detectedAt) : new Date(),
        });
    }

    toJson() {
        return {
            id: this.id,
            type: this.type,
            severity: this.severity,
            confidence: this.confidence,
            location: this.location,
            cableId: this.cableId,
            detectedAt: this.detectedAt.toISOString(),
        };
    }
}
