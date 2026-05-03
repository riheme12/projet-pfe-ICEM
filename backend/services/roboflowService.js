/**
 * Service d'intégration Roboflow pour la détection de défauts de câbles
 * 
 * Ce service communique avec l'API Roboflow Inference pour analyser
 * les images capturées par le technicien et détecter les anomalies.
 * 
 * Modèle : YOLOv11 Object Detection — wire-default-dtection
 */
const https = require('https');

// Configuration Roboflow
const ROBOFLOW_CONFIG = {
    apiKey: process.env.ROBOFLOW_API_KEY || '',
    modelId: process.env.ROBOFLOW_MODEL_ID || 'wire-default-dtection-utdc7',
    modelVersion: process.env.ROBOFLOW_MODEL_VERSION || '2',
    // Normalisation du seuil : si > 1, on divise par 100 (ex: 25 -> 0.25)
    confidenceThreshold: (function() {
        let val = parseFloat(process.env.ROBOFLOW_CONFIDENCE || '0.15');
        return val > 1 ? val / 100 : val;
    })(),
    overlapThreshold: (function() {
        let val = parseFloat(process.env.ROBOFLOW_OVERLAP || '0.30');
        return val > 1 ? val / 100 : val;
    })(),
};


/**
 * Mapping des classes détectées par le modèle Roboflow
 * vers les types et sévérités du système ICEM
 */
const CLASS_MAPPING = {
    'composant_mal_insere':  { type: 'Composant mal inséré',    defaultSeverity: 'Critique', code: 'P' },
    'composant_manquant':    { type: 'Composant manquant',      defaultSeverity: 'Critique', code: 'P' },
    'etiquette_anomalie':    { type: 'Anomalie étiquette',      defaultSeverity: 'Mineur',   code: 'V' },
    'protection_anomalie':   { type: 'Anomalie protection',     defaultSeverity: 'Majeur',   code: 'M' },
    'connecteur_anomalie':   { type: 'Anomalie connecteur',     defaultSeverity: 'Critique', code: 'J' },
    'cosse_anomalie':        { type: 'Anomalie cosse',          defaultSeverity: 'Majeur',   code: 'A' },
    'scotche_anomalie':      { type: 'Anomalie scotch',         defaultSeverity: 'Mineur',   code: 'S' },
    'default':               { type: 'Défaut détecté',          defaultSeverity: 'Majeur',   code: 'Z' },
};

/**
 * Détermine la sévérité en fonction de la classe et du score de confiance
 */
function determineSeverity(className, confidence) {
    const mapping = CLASS_MAPPING[className.toLowerCase()] || CLASS_MAPPING['default'];
    
    if (confidence >= 0.85) return 'Critique';
    
    // Ne pas rétrograder si c'est déjà critique par défaut
    if (mapping.defaultSeverity === 'Critique') return 'Critique';
    
    if (confidence < 0.30) return 'Mineur';
    
    return mapping.defaultSeverity;
}


/**
 * Mappe un nom de classe Roboflow vers un type d'anomalie ICEM
 */
function mapClassToAnomalyType(className) {
    const mapping = CLASS_MAPPING[className.toLowerCase()] || CLASS_MAPPING['default'];
    return mapping.type;
}

/**
 * Appel à l'API d'inférence Roboflow
 * 
 * @param {string} base64Image - Image encodée en base64
 * @returns {Promise<Object>} - Résultat de l'inférence
 */
async function analyzeImage(base64Image) {
    if (!ROBOFLOW_CONFIG.apiKey) {
        throw new Error('ROBOFLOW_API_KEY non configurée dans le fichier .env');
    }

    const conf = Math.round(ROBOFLOW_CONFIG.confidenceThreshold * 100);
    const overlap = Math.round(ROBOFLOW_CONFIG.overlapThreshold * 100);
    
    const url = `https://detect.roboflow.com/${ROBOFLOW_CONFIG.modelId}/${ROBOFLOW_CONFIG.modelVersion}?api_key=${ROBOFLOW_CONFIG.apiKey}&confidence=${conf}&overlap=${overlap}`;

    return new Promise((resolve, reject) => {

        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(base64Image),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode !== 200) {
                        reject(new Error(`Roboflow API error (${res.statusCode}): ${parsed.message || data}`));
                        return;
                    }
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Failed to parse Roboflow response: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Roboflow request failed: ${e.message}`));
        });

        req.write(base64Image);
        req.end();
    });
}

/**
 * Analyse une image et retourne un résultat structuré pour le système ICEM
 * 
 * @param {string} base64Image - Image encodée en base64
 * @returns {Promise<Object>} Résultat structuré avec status, anomalies détectées, etc.
 */
async function detectDefects(base64Image) {
    try {
        const roboflowResult = await analyzeImage(base64Image);
        const predictions = roboflowResult.predictions || [];
        
        console.log(`[IA] Analyse terminée. Objets détectés: ${predictions.length}`);
        predictions.forEach(p => console.log(`   - ${p.class}: ${(p.confidence * 100).toFixed(1)}%`));

        if (predictions.length === 0) {
            return {
                status: 'OK',
                label: 'Aucun défaut détecté',
                confidence: 0.95,
                anomalies: [],
                rawPredictions: [],
                imageWidth: roboflowResult.image?.width || 0,
                imageHeight: roboflowResult.image?.height || 0,
            };
        }

        // Mapper les prédictions en anomalies ICEM
        const anomalies = predictions.map((pred, index) => {
            const mapping = CLASS_MAPPING[pred.class.toLowerCase()] || CLASS_MAPPING['default'];
            return {
                detectionId: `det_${index}`,
                type: mapping.type,
                code: mapping.code, // Nouveau: Code pour la fiche papier
                roboflowClass: pred.class,
                confidence: pred.confidence,
                severity: determineSeverity(pred.class, pred.confidence),
                boundingBox: {
                    x: pred.x,
                    y: pred.y,
                    width: pred.width,
                    height: pred.height,
                },
            };
        });


        // Trouver l'anomalie la plus critique
        const severityOrder = { 'Critique': 3, 'Majeur': 2, 'Mineur': 1 };
        const mostCritical = anomalies.reduce((prev, curr) => {
            const prevScore = severityOrder[prev.severity] || 0;
            const currScore = severityOrder[curr.severity] || 0;
            return currScore > prevScore ? curr : prev;
        });

        return {
            status: 'NOK',
            label: mostCritical.type,
            confidence: mostCritical.confidence,
            severity: mostCritical.severity,
            anomalies: anomalies,
            totalDefects: anomalies.length,
            rawPredictions: predictions,
            imageWidth: roboflowResult.image?.width || 0,
            imageHeight: roboflowResult.image?.height || 0,
        };

    } catch (error) {
        console.error('Roboflow detection error:', error.message);
        throw error;
    }
}

module.exports = {
    analyzeImage,
    detectDefects,
    mapClassToAnomalyType,
    determineSeverity,
    ROBOFLOW_CONFIG,
    CLASS_MAPPING,
};
