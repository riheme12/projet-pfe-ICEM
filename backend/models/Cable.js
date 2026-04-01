/**
 * Modèle représentant un câble à inspecter
 * Synchronisé avec lib/models/cable.dart (mobile)
 * 
 * Chaque câble appartient à un ordre de fabrication
 * et peut avoir plusieurs anomalies détectées
 */
class Cable {
    constructor({ id, reference, code, orderId, status, inspectionDate = null, technicianId = null, imageUrls = [], anomaliesCount = 0 }) {
        this.id = id;
        this.reference = reference;          // Référence du câble
        this.code = code;                    // Code unique du câble
        this.orderId = orderId;              // ID de l'ordre parent
        this.status = status;                // 'Conforme', 'Non conforme', 'En attente'
        this.inspectionDate = inspectionDate ? new Date(inspectionDate) : null;
        this.technicianId = technicianId;    // ID du technicien qui a inspecté
        this.imageUrls = imageUrls || [];    // URLs des images capturées
        this.anomaliesCount = anomaliesCount || 0;
    }

    /**
     * Vérifier si le câble a été inspecté
     */
    get isInspected() {
        return this.inspectionDate !== null;
    }

    /**
     * Vérifier si le câble est conforme
     */
    get isConform() {
        return this.status?.toLowerCase() === 'conforme';
    }

    /**
     * Créer depuis JSON
     */
    static fromJson(json) {
        let inspectionDate = null;
        const dateInput = json.inspectionDate || json.DateLiv; // Some use DateLiv too? Just in case.
        if (dateInput) {
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                inspectionDate = dateInput.toDate();
            } else {
                const d = new Date(dateInput);
                inspectionDate = isNaN(d.getTime()) ? null : d;
            }
        }

        return new Cable({
            id: json.id,
            reference: json.reference || json.code || 'Inconnu',
            code: json.code || '',
            orderId: json.orderId || '',
            status: json.status || 'En attente',
            inspectionDate: inspectionDate,
            technicianId: json.technicianId || null,
            imageUrls: json.imageUrls || [],
            anomaliesCount: Number(json.anomaliesCount) || 0,
        });
    }

    /**
     * Convertir en JSON
     */
    toJson() {
        return {
            id: this.id,
            reference: this.reference,
            code: this.code,
            orderId: this.orderId,
            status: this.status,
            inspectionDate: this.inspectionDate ? this.inspectionDate.toISOString() : null,
            technicianId: this.technicianId,
            imageUrls: this.imageUrls,
            anomaliesCount: this.anomaliesCount,
        };
    }
}

module.exports = { Cable };
