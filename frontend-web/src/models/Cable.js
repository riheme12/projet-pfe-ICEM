/**
 * Modèle représentant un câble à inspecter
 * Synchronisé avec lib/models/cable.dart (mobile)
 */
export class Cable {
    constructor({ id, reference, code, orderId, status, inspectionDate = null, technicianId = null, imageUrls = [], anomaliesCount = 0 }) {
        this.id = id;
        this.reference = reference;
        this.code = code;
        this.orderId = orderId;
        this.status = status;               // 'Conforme', 'Non conforme', 'En attente'
        this.inspectionDate = inspectionDate ? new Date(inspectionDate) : null;
        this.technicianId = technicianId;
        this.imageUrls = imageUrls || [];
        this.anomaliesCount = anomaliesCount || 0;
    }

    get isInspected() {
        return this.inspectionDate !== null;
    }

    get isConform() {
        return this.status === 'Conforme';
    }

    static fromJson(json) {
        return new Cable({
            id: json.id,
            reference: json.reference,
            code: json.code,
            orderId: json.orderId,
            status: json.status,
            inspectionDate: json.inspectionDate || null,
            technicianId: json.technicianId || null,
            imageUrls: json.imageUrls || [],
            anomaliesCount: json.anomaliesCount || 0,
        });
    }

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
