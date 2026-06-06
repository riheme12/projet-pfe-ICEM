const { determineSeverity, mapClassToAnomalyType } = require('../../services/roboflowService');

describe('Roboflow Service (Unit Tests)', () => {
    describe('mapClassToAnomalyType', () => {
        it('should map known classes to correct anomaly types', () => {
            expect(mapClassToAnomalyType('composant_manquant')).toBe('Composant manquant');
            expect(mapClassToAnomalyType('etiquette_anomalie')).toBe('Anomalie étiquette');
        });

        it('should return default type for unknown classes', () => {
            expect(mapClassToAnomalyType('unknown_class_123')).toBe('Défaut détecté');
        });
    });

    describe('determineSeverity', () => {
        it('should assign correct severity levels based on class mapping for any confidence', () => {
            expect(determineSeverity('scotche_anomalie', 0.90)).toBe('Mineur');
            expect(determineSeverity('cosse_anomalie', 0.25)).toBe('Majeur');
            expect(determineSeverity('etiquette_anomalie', 0.60)).toBe('Mineur');
            expect(determineSeverity('protection_anomalie', 0.60)).toBe('Majeur');
            expect(determineSeverity('composant_manquant', 0.20)).toBe('Critique'); 
        });
    });
});
