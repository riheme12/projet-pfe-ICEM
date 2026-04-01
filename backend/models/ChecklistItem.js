/**
 * Modèle pour un point de contrôle dans une checklist
 * Synchronisé avec lib/models/checklist_item.dart (mobile)
 */

// Résultats possibles pour un point de contrôle
const ChecklistResult = Object.freeze({
    OK: 'ok',
    NOK: 'nok',
    NA: 'na',
    PENDING: 'pending',
});

class ChecklistItem {
    constructor({ label, result = ChecklistResult.PENDING, comment = null }) {
        this.label = label;
        this.result = result;
        this.comment = comment;
    }

    static fromJson(json) {
        return new ChecklistItem({
            label: json.label,
            result: json.result || ChecklistResult.PENDING,
            comment: json.comment || null,
        });
    }

    toJson() {
        return {
            label: this.label,
            result: this.result,
            comment: this.comment,
        };
    }
}

module.exports = { ChecklistItem, ChecklistResult };
