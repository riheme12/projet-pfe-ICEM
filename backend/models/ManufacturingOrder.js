/**
 * Modèle représentant un ordre de fabrication
 * Synchronisé avec lib/models/manufacturing_order.dart (mobile)
 * 
 * Un ordre de fabrication contient :
 * - Les informations de production (référence, type, quantité)
 * - Le statut de l'ordre
 * - Les statistiques de conformité
 */
class ManufacturingOrder {
    constructor({ id, reference, cableType, quantity, productionDate, status, assignedTechnicianId = null, inspectedCount = 0, conformCount = 0, nonConformCount = 0 }) {
        this.id = id;
        this.reference = reference;                      // Ex: "OF-2024-001"
        this.cableType = cableType;                      // Ex: "Câble électrique 3x2.5mm²"
        this.quantity = quantity;                         // Quantité totale à produire
        this.productionDate = productionDate instanceof Date ? productionDate : new Date(productionDate);
        this.status = status;                            // 'En cours', 'Terminé', 'En attente'
        this.assignedTechnicianId = assignedTechnicianId;
        this.inspectedCount = inspectedCount;            // Nombre de câbles déjà inspectés
        this.conformCount = conformCount;                // Nombre de câbles conformes
        this.nonConformCount = nonConformCount;          // Nombre de câbles non conformes
    }

    /**
     * Calculer le taux de conformité de cet ordre (0-100)
     */
    get conformityRate() {
        if (this.inspectedCount === 0) return 0.0;
        return (this.conformCount / this.inspectedCount) * 100;
    }

    /**
     * Calculer le pourcentage de progression (0-100)
     */
    get progressPercentage() {
        if (this.quantity === 0) return 0.0;
        return (this.inspectedCount / this.quantity) * 100;
    }

    /**
     * Vérifier si l'ordre est terminé
     */
    get isCompleted() {
        return this.inspectedCount >= this.quantity;
    }

    /**
     * Créer depuis JSON (Mapping Firestore)
     */
    static fromJson(json) {
        let productionDate = new Date();
        const dateInput = json.productionDate || json.DateLiv;

        if (dateInput) {
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                productionDate = dateInput.toDate();
            } else {
                productionDate = new Date(dateInput);
            }
        }

        const rawStatus = (json.status || 'En attente').toString();
        const statusLower = rawStatus.toLowerCase();

        let normalizedStatus = 'En attente';
        if (statusLower === 'en cours') normalizedStatus = 'En cours';
        else if (statusLower === 'terminé' || statusLower === 'termine') normalizedStatus = 'Terminé';
        else normalizedStatus = rawStatus; // Use original if it doesn't match known ones

        return new ManufacturingOrder({
            id: json.id,
            reference: json.reference || json.numeroOF,
            cableType: json.cableType || json.NumComd || json.client || 'Inconnu',
            quantity: json.quantity || json.QTA || 0,
            productionDate: productionDate,
            status: normalizedStatus,
            assignedTechnicianId: json.assignedTechnicianId || json.ligne || null,
            inspectedCount: json.inspectedCount || 0,
            conformCount: json.conformCount || 0,
            nonConformCount: json.nonConformCount || 0,
        });
    }

    /**
     * Convertir en JSON
     * Retourne à la fois les noms d'usage (API/Front) et les noms Firestore (Persistance)
     */
    toJson() {
        return {
            id: this.id,
            reference: this.reference,
            numeroOF: this.reference,
            cableType: this.cableType,
            NumComd: this.cableType,
            client: this.cableType,
            quantity: this.quantity,
            QTA: this.quantity,
            productionDate: this.productionDate.toISOString(),
            DateLiv: this.productionDate.toISOString(),
            status: this.status.toLowerCase(), // Firestore format
            statusDisplay: this.status,        // UI format
            assignedTechnicianId: this.assignedTechnicianId,
            ligne: this.assignedTechnicianId,
            inspectedCount: this.inspectedCount,
            conformCount: this.conformCount,
            nonConformCount: this.nonConformCount,
        };
    }
}

module.exports = { ManufacturingOrder };
