/**
 * Modèle représentant une anomalie détectée par l'IA
 * Synchronisé avec lib/models/anomaly.dart (mobile)
 * 
 * Une anomalie est un défaut détecté sur un câble
 * Elle a un type, une gravité et un score de confiance
 */
class Anomaly {
    constructor({ id, type, severity, confidence, location = null, cableId, detectedAt }) {
        this.id = id;
        this.type = type;                // 'Rayure', 'Déformation', 'Défaut de surface', etc.
        this.severity = severity;        // 'Mineur', 'Majeur', 'Critique'
        this.confidence = confidence;    // Score de confiance IA (0.0 - 1.0)
        this.location = location;        // Description de la localisation
        this.cableId = cableId;          // ID du câble concerné
        this.detectedAt = detectedAt instanceof Date ? detectedAt : new Date(detectedAt || Date.now());
    }

    /**
     * Obtenir la couleur associée à la gravité
     */
    get severityColor() {
        switch (this.severity) {
            case 'Critique': return 'red';
            case 'Majeur': return 'orange';
            case 'Mineur': return 'yellow';
            default: return 'grey';
        }
    }

    /**
     * Vérifier si l'anomalie est critique
     */
    get isCritical() {
        return this.severity === 'Critique';
    }

    /**
     * Créer depuis JSON
     */
    static fromJson(json) {
        let detectedAt = new Date();
        const dateInput = json.detectedAt || json.timestamp || json.date;
        if (dateInput) {
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                detectedAt = dateInput.toDate();
            } else {
                const d = new Date(dateInput);
                if (!isNaN(d.getTime())) detectedAt = d;
            }
        }

        return new Anomaly({
            id: json.id,
            type: json.type || json.description || 'Inconnu',
            severity: json.severity || 'Mineur',
            confidence: Number(json.confidence) || 0,
            location: json.location || null,
            cableId: json.cableId || '',
            detectedAt: detectedAt,
        });
    }

    /**
     * Convertir en JSON
     */
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

module.exports = { Anomaly };
