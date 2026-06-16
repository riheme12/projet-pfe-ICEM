/**
 * Modèle représentant un type d'anomalie dans le système ICEM (UML : typeAnomaly)
 * Catalogue statique des types de défauts réels du projet (visuels et électriques)
 */
class TypeAnomaly {
    constructor({ anomalyId, type, description }) {
        this.anomalyId = anomalyId;
        this.type = type;
        this.description = description;
    }

    /**
     * Obtenir un type d'anomalie par son code ou libellé
     */
    static getByCode(code) {
        const catalog = TypeAnomaly.getActiveType();
        return catalog.find(a => a.anomalyId === code || a.type.toLowerCase() === code.toLowerCase()) || 
            new TypeAnomaly({
                anomalyId: 'A00',
                type: 'Inconnu',
                description: 'Type d\'anomalie non répertorié.'
            });
    }

    /**
     * Obtenir tous les types d'anomalies actifs
     */
    static getActiveType() {
        return [
            // --- Anomalies du Contrôle Visuel (Codes de checklist_page.dart) ---
            new TypeAnomaly({
                anomalyId: 'A',
                type: 'Cosse déformée',
                description: 'Cosse déformée détectée lors de l\'inspection visuelle.'
            }),
            new TypeAnomaly({
                anomalyId: 'B',
                type: 'Cosse ébanchati',
                description: 'Cosse ébanchati détectée lors de l\'inspection visuelle.'
            }),
            new TypeAnomaly({
                anomalyId: 'C',
                type: 'Cosse ouverte',
                description: 'Cosse ouverte détectée lors de l\'inspection visuelle.'
            }),
            new TypeAnomaly({
                anomalyId: 'D',
                type: 'Fil pincé/coupé',
                description: 'Fil pincé ou coupé sur le faisceau.'
            }),
            new TypeAnomaly({
                anomalyId: 'E',
                type: 'Fils inversés',
                description: 'Fils inversés dans le connecteur.'
            }),
            new TypeAnomaly({
                anomalyId: 'F',
                type: 'Fil tendu',
                description: 'Fil trop tendu risquant de rompre.'
            }),
            new TypeAnomaly({
                anomalyId: 'G',
                type: 'Fil sans cosse',
                description: 'Fil dénudé sans cosse sertie.'
            }),
            new TypeAnomaly({
                anomalyId: 'H',
                type: 'Ticket élec. NC',
                description: 'Ticket de test électrique non conforme.'
            }),
            new TypeAnomaly({
                anomalyId: 'I',
                type: 'Long./couleur NC',
                description: 'Longueur ou couleur de fil non conforme aux spécifications.'
            }),
            new TypeAnomaly({
                anomalyId: 'J',
                type: 'Conn. cassé',
                description: 'Connecteur cassé ou endommagé.'
            }),
            new TypeAnomaly({
                anomalyId: 'K',
                type: 'Bouchette manq.',
                description: 'Bouchette d\'étanchéité manquante.'
            }),
            new TypeAnomaly({
                anomalyId: 'L',
                type: 'Tube thermo NC',
                description: 'Tube thermorétractable non conforme.'
            }),
            new TypeAnomaly({
                anomalyId: 'M',
                type: 'Protection manq.',
                description: 'Gaine ou élément de protection manquant.'
            }),
            new TypeAnomaly({
                anomalyId: 'N',
                type: 'Tube manqué',
                description: 'Tube manquant sur la dérivation.'
            }),
            new TypeAnomaly({
                anomalyId: 'O',
                type: 'Vis mal serrée',
                description: 'Vis de serrage ou de fixation non conforme.'
            }),
            new TypeAnomaly({
                anomalyId: 'P',
                type: 'Composant manq.',
                description: 'Composant d\'assemblage manquant.'
            }),
            new TypeAnomaly({
                anomalyId: 'Q',
                type: 'Fusible manq.',
                description: 'Fusible manquant sur la boîte.'
            }),
            new TypeAnomaly({
                anomalyId: 'R',
                type: 'Gamme manq.',
                description: 'Gamme de fabrication manquante.'
            }),
            new TypeAnomaly({
                anomalyId: 'S',
                type: 'Scotch mal exécuté',
                description: 'Scotchage ou rubanage mal appliqué.'
            }),
            new TypeAnomaly({
                anomalyId: 'T',
                type: 'Mesure Dériv.',
                description: 'Mesure de la dérivation hors tolérance.'
            }),
            new TypeAnomaly({
                anomalyId: 'V',
                type: 'Étiquette manquante',
                description: 'Étiquette d\'identification manquante.'
            }),
            new TypeAnomaly({
                anomalyId: 'W',
                type: 'Étiquette inv.',
                description: 'Étiquette d\'identification inversée.'
            }),
            new TypeAnomaly({
                anomalyId: 'Z',
                type: 'Autres défauts',
                description: 'Autre défaut visuel non spécifié.'
            }),

            // --- Anomalies du Contrôle Électrique (Codes de electrical_checklist_page.dart) ---
            new TypeAnomaly({
                anomalyId: 'fmiC',
                type: 'FMI Conn.',
                description: 'Fil mal inséré sur le connecteur (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'fmiP',
                type: 'FMI Pos.',
                description: 'Fil mal inséré sur la position/alvéole (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'fiC',
                type: 'FI Conn.',
                description: 'Fil inversé sur le connecteur (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'fiP',
                type: 'FI Pos.',
                description: 'Fil inversé sur la position (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'fiMC',
                type: 'FI Mar/Coul',
                description: 'Fil inversé au niveau du marquage ou de la couleur (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'emC',
                type: 'Étiq. Manq.',
                description: 'Étiquette manquante sur le connecteur (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'eiC1',
                type: 'Étiq. Inv. C1',
                description: 'Étiquette inversée sur le connecteur 1 (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'eiC2',
                type: 'Étiq. Inv. C2',
                description: 'Étiquette inversée sur le connecteur 2 (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'cDer',
                type: 'Conn. Dériv.',
                description: 'Défaut de connecteur ou dérivation (Contrôle Électrique).'
            }),
            new TypeAnomaly({
                anomalyId: 'pmC',
                type: 'Prot. Manq.',
                description: 'Protection manquante sur le connecteur (Contrôle Électrique).'
            })
        ];
    }
}

module.exports = { TypeAnomaly };
