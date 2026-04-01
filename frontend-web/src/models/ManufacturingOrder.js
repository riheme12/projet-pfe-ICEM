/**
 * Modèle représentant un ordre de fabrication
 * Synchronisé avec lib/models/manufacturing_order.dart (mobile)
 */
export class ManufacturingOrder {
    constructor({ id, reference, cableType, quantity, productionDate, status, assignedTechnicianId = null, inspectedCount = 0, conformCount = 0, nonConformCount = 0 }) {
        this.id = id;
        this.reference = reference;                      // Ex: "OF-2024-001"
        this.cableType = cableType;                      // Ex: "Câble électrique 3x2.5mm²"
        this.quantity = quantity;
        this.productionDate = productionDate instanceof Date ? productionDate : new Date(productionDate);
        this.status = status;                            // 'En cours', 'Terminé', 'En attente'
        this.assignedTechnicianId = assignedTechnicianId;
        this.inspectedCount = inspectedCount;
        this.conformCount = conformCount;
        this.nonConformCount = nonConformCount;
    }

    get conformityRate() {
        if (this.inspectedCount === 0) return 0.0;
        return (this.conformCount / this.inspectedCount) * 100;
    }

    get progressPercentage() {
        if (this.quantity === 0) return 0.0;
        return (this.inspectedCount / this.quantity) * 100;
    }

    get isCompleted() {
        return this.inspectedCount >= this.quantity;
    }

    static fromJson(json) {
        return new ManufacturingOrder({
            id: json.id,
            reference: json.reference,
            cableType: json.cableType,
            quantity: json.quantity,
            productionDate: json.productionDate ? new Date(json.productionDate) : new Date(),
            status: json.status,
            assignedTechnicianId: json.assignedTechnicianId || null,
            inspectedCount: json.inspectedCount || 0,
            conformCount: json.conformCount || 0,
            nonConformCount: json.nonConformCount || 0,
        });
    }

    toJson() {
        return {
            id: this.id,
            reference: this.reference,
            cableType: this.cableType,
            quantity: this.quantity,
            productionDate: this.productionDate.toISOString(),
            status: this.status,
            assignedTechnicianId: this.assignedTechnicianId,
            inspectedCount: this.inspectedCount,
            conformCount: this.conformCount,
            nonConformCount: this.nonConformCount,
        };
    }
}
