/**
 * Modèle représentant un ordre de fabrication
 * Synchronisé avec lib/models/manufacturing_order.dart (mobile)
 * 
 * Un ordre de fabrication contient :
 * - Les informations de production (référence, client, commande, type, quantité)
 * - Le statut de l'ordre
 * - Les statistiques de conformité
 */
class ManufacturingOrder {
    constructor({ 
        id, reference, client, numComd, cableType, quantity, 
        productionDate, dateLiv, status, ligne = null, 
        inspectedCount = 0, conformCount = 0, nonConformCount = 0 
    }) {
        this.id = id;
        this.reference = reference;                      // Ex: "OF-2024-001" (numeroOF)
        this.client = client;                            // Client (client)
        this.numComd = numComd;                          // Numéro de commande (NumComd)
        this.cableType = cableType;                      // Type de câble (cableType)
        this.quantity = quantity;                        // Quantité totale à produire (QTA)
        this.productionDate = productionDate instanceof Date ? productionDate : new Date(productionDate);
        this.dateLiv = dateLiv instanceof Date ? dateLiv : (dateLiv ? new Date(dateLiv) : null);
        this.status = status;                            // 'En cours', 'Terminé', 'En attente'
        this.ligne = ligne;                              // Ligne de production (ligne)
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
     * Créer depuis JSON (Mapping Firestore)
     */
    static fromJson(json) {
        // Date de production
        let productionDate = new Date();
        if (json.productionDate) {
            productionDate = json.productionDate.toDate ? json.productionDate.toDate() : new Date(json.productionDate);
        }

        // Date de livraison (DateLiv)
        let dateLiv = null;
        if (json.dateLiv || json.DateLiv) {
            const d = json.dateLiv || json.DateLiv;
            dateLiv = d.toDate ? d.toDate() : new Date(d);
        }

        const rawStatus = (json.status || 'En attente').toString();
        const statusLower = rawStatus.toLowerCase();

        let normalizedStatus = 'En attente';
        if (statusLower === 'en cours') normalizedStatus = 'En cours';
        else if (statusLower === 'terminé' || statusLower === 'termine') normalizedStatus = 'Terminé';
        else normalizedStatus = rawStatus;

        return new ManufacturingOrder({
            id: json.id,
            reference: json.reference || json.numeroOF,
            client: json.client || 'Inconnu',
            numComd: json.numComd || json.NumComd || '',
            cableType: json.cableType || '',
            quantity: json.quantity || json.QTA || 0,
            productionDate: productionDate,
            dateLiv: dateLiv,
            status: normalizedStatus,
            ligne: json.ligne || json.assignedTechnicianId || null,
            inspectedCount: json.inspectedCount || 0,
            conformCount: json.conformCount || 0,
            nonConformCount: json.nonConformCount || 0,
        });
    }

    /**
     * Convertir en JSON
     */
    toJson() {
        return {
            id: this.id,
            reference: this.reference,
            numeroOF: this.reference,
            client: this.client,
            numComd: this.numComd,
            NumComd: this.numComd,
            cableType: this.cableType,
            quantity: this.quantity,
            QTA: this.quantity,
            productionDate: this.productionDate.toISOString(),
            dateLiv: this.dateLiv ? this.dateLiv.toISOString() : null,
            DateLiv: this.dateLiv ? this.dateLiv.toISOString() : null,
            status: this.status.toLowerCase(),
            statusDisplay: this.status,
            ligne: this.ligne,
            assignedTechnicianId: this.ligne,
            inspectedCount: this.inspectedCount,
            conformCount: this.conformCount,
            nonConformCount: this.nonConformCount,
        };
    }
}

module.exports = { ManufacturingOrder };
