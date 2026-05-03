/**
 * Modèle représentant un rapport d'inspection
 * Synchronisé avec lib/models/report.dart (mobile)
 * 
 * Un rapport est généré après chaque inspection de câble
 * Il contient toutes les informations de l'inspection
 */
class Report {
    constructor({ id, cableId, orderId, technicianId, technicianName = null, type = null, generatedAt, conformityStatus, anomaliesCount = 0, pdfUrl = null, notes = null }) {
        this.id = id;
        this.cableId = cableId;                  // ID du câble inspecté
        this.orderId = orderId;                  // ID de l'ordre de fabrication
        this.technicianId = technicianId;        // ID du technicien
        this.technicianName = technicianName;    // Nom du technicien
        this.type = type;                        // Type du rapport
        this.generatedAt = generatedAt instanceof Date ? generatedAt : new Date(generatedAt || Date.now());
        this.conformityStatus = conformityStatus; // 'Conforme' ou 'Non conforme'
        this.anomaliesCount = anomaliesCount;    // Nombre d'anomalies détectées
        this.pdfUrl = pdfUrl;                    // URL du PDF généré
        this.notes = notes;                      // Notes du technicien
    }

    /**
     * Vérifier si le câble est conforme
     */
    get isConform() {
        return this.conformityStatus === 'Conforme';
    }

    /**
     * Vérifier si le PDF est disponible
     */
    get hasPdf() {
        return this.pdfUrl !== null && this.pdfUrl !== '';
    }

    /**
     * Créer depuis JSON
     */
    static fromJson(json) {
        let generatedAt = new Date();
        const dateInput = json.generatedAt || json.date || json.timestamp;
        if (dateInput) {
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                generatedAt = dateInput.toDate();
            } else {
                const d = new Date(dateInput);
                if (!isNaN(d.getTime())) generatedAt = d;
            }
        }

        return new Report({
            id: json.id,
            cableId: json.cableId || '',
            orderId: json.orderId || '',
            technicianId: json.technicianId || '',
            technicianName: json.technicianName || null,
            type: json.type || null,
            generatedAt: generatedAt,
            conformityStatus: json.conformityStatus || 'En attente',
            anomaliesCount: Number(json.anomaliesCount) || 0,
            pdfUrl: json.pdfUrl || null,
            notes: json.notes || null,
        });
    }

    /**
     * Convertir en JSON
     */
    toJson() {
        return {
            id: this.id,
            cableId: this.cableId,
            orderId: this.orderId,
            technicianId: this.technicianId,
            technicianName: this.technicianName,
            type: this.type,
            generatedAt: this.generatedAt.toISOString(),
            conformityStatus: this.conformityStatus,
            anomaliesCount: this.anomaliesCount,
            pdfUrl: this.pdfUrl,
            notes: this.notes,
        };
    }
}

module.exports = { Report };
