/**
 * Modèle représentant un ordre de fabrication
 * Synchronisé avec lib/models/manufacturing_order.dart (mobile)
 * 
 * Un ordre de fabrication contient :
 * - Les informations de production (référence, client, commande, quantité)
 * - Le statut de l'ordre
 * - Les statistiques de conformité
 */
class ManufacturingOrder {
    constructor({ 
        id, reference, numeroOF, client, numComd, quantity, 
        productionDate, dateLiv, status, ligne = null, 
        giPros = '', inspectedCount = 0, conformCount = 0, nonConformCount = 0 
    }) {
        this.id = id;
        this.reference = reference;                      // Référence produit (ex: 1111472)
        this.numeroOF = numeroOF;                        // Numéro OF (ex: OFL26/0391) — utilisé comme orderId des câbles
        this.client = client;                            // client
        this.numComd = numComd;                          // NumComd
        this.giPros = giPros;                            // GI PROS
        this.quantity = quantity;                        // QTA
        this.productionDate = productionDate instanceof Date ? productionDate : new Date(productionDate);
        this.dateLiv = dateLiv instanceof Date ? dateLiv : (dateLiv ? new Date(dateLiv) : null);
        this.status = status;                            // 'En cours', 'Terminé', 'En attente'
        this.ligne = ligne;                              // ligne
        this.inspectedCount = inspectedCount;            
        this.conformCount = conformCount;                
        this.nonConformCount = nonConformCount;          
    }

    // Alignement avec le diagramme de classe de conception (DCC)
    get numeroOf() { return this.numeroOF; }
    get qte() { return this.quantity; }
    get RemainingQuantity() { return this.inspectedCount < this.quantity; }
    get RemainingCableCount() { return this.inspectedCount < this.quantity; }

    startOrder() {
        // Squelette de méthode pour le DCC
    }

    completeOrder() {
        // Squelette de méthode pour le DCC
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
        let productionDate = new Date();
        if (json.productionDate) {
            productionDate = json.productionDate.toDate ? json.productionDate.toDate() : new Date(json.productionDate);
        }

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
            reference: json.reference || json.numeroOF || '',
            numeroOF: json.numeroOF || json.reference || '',
            client: json.client || json.Client || 'Inconnu',
            numComd: json.numComd || json.NumComd || '',
            giPros: json.giPros || json["Gi pros"] || json.gi_pros || '',
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
            numeroOF: this.numeroOF,
            client: this.client,
            Client: this.client,
            numComd: this.numComd,
            NumComd: this.numComd,
            giPros: this.giPros,
            "Gi pros": this.giPros,
            gi_pros: this.giPros,
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
