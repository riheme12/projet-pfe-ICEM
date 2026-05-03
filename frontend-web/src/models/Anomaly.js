/**
 * Modèle représentant une anomalie détectée par l'IA
 * Synchronisé avec lib/models/anomaly.dart (mobile)
 */
export class Anomaly {
    constructor({
        id,
        type,
        severity,
        confidence,
        location = null,
        cableId,
        detectedAt,
        technicianId = null,
        technicianName = null,
        statut = null,
        mesureCorrective = null,
        inspectionId = null,
        orderId = null,
    }) {
        this.id = id;
        this.type = type;                // 'Rayure', 'Déformation', 'Défaut de surface', etc.
        this.severity = severity;        // 'Mineur', 'Majeur', 'Critique'
        this.confidence = confidence;    // Score de confiance IA (0.0 - 1.0)
        this.location = location;        // Description de la localisation
        this.cableId = cableId;          // ID du câble concerné
        this.detectedAt = detectedAt instanceof Date ? detectedAt : new Date(detectedAt || Date.now());
        this.technicianId = technicianId;
        this.technicianName = technicianName;
        this.statut = statut;
        this.mesureCorrective = mesureCorrective;
        this.inspectionId = inspectionId;
        this.orderId = orderId;
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
            technicianId: json.technicianId || null,
            technicianName: json.technicianName || null,
            statut: json.statut || null,
            mesureCorrective: json.mesureCorrective || null,
            inspectionId: json.inspectionId || null,
            orderId: json.orderId || null,
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
            technicianId: this.technicianId,
            technicianName: this.technicianName,
            statut: this.statut,
            mesureCorrective: this.mesureCorrective,
            inspectionId: this.inspectionId,
            orderId: this.orderId,
        };
    }
}
