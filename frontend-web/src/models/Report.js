/**
 * Modèle représentant un rapport d'inspection
 * Synchronisé avec lib/models/report.dart (mobile)
 */
export class Report {
    constructor({ id, cableId, orderId, technicianId, generatedAt, conformityStatus, anomaliesCount = 0, pdfUrl = null, notes = null }) {
        this.id = id;
        this.cableId = cableId;
        this.orderId = orderId;
        this.technicianId = technicianId;
        this.generatedAt = generatedAt instanceof Date ? generatedAt : new Date(generatedAt || Date.now());
        this.conformityStatus = conformityStatus;   // 'Conforme' ou 'Non conforme'
        this.anomaliesCount = anomaliesCount;
        this.pdfUrl = pdfUrl;
        this.notes = notes;
    }

    get isConform() {
        return this.conformityStatus === 'Conforme';
    }

    get hasPdf() {
        return this.pdfUrl !== null && this.pdfUrl !== '';
    }

    static fromJson(json) {
        return new Report({
            id: json.id,
            cableId: json.cableId,
            orderId: json.orderId,
            technicianId: json.technicianId,
            generatedAt: json.generatedAt ? new Date(json.generatedAt) : new Date(),
            conformityStatus: json.conformityStatus,
            anomaliesCount: json.anomaliesCount || 0,
            pdfUrl: json.pdfUrl || null,
            notes: json.notes || null,
        });
    }

    toJson() {
        return {
            id: this.id,
            cableId: this.cableId,
            orderId: this.orderId,
            technicianId: this.technicianId,
            generatedAt: this.generatedAt.toISOString(),
            conformityStatus: this.conformityStatus,
            anomaliesCount: this.anomaliesCount,
            pdfUrl: this.pdfUrl,
            notes: this.notes,
        };
    }
}
