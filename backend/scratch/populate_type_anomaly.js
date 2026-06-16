const { db } = require('../firebase');
const { TypeAnomaly } = require('../models');

async function populateTypeAnomaly() {
    console.log('Début du remplissage de la collection typeAnomaly...');
    try {
        const catalog = TypeAnomaly.getActiveType();
        console.log(`Nombre de types d'anomalies à enregistrer : ${catalog.length}`);

        for (const item of catalog) {
            // Utiliser anomalyId comme ID du document pour que ce soit propre
            await db.collection('typeAnomaly').doc(item.anomalyId).set({
                anomalyId: item.anomalyId,
                type: item.type,
                description: item.description
            });
            console.log(`Enregistré : [${item.anomalyId}] - ${item.type}`);
        }

        console.log('\n--- REMPLISSAGE TERMINÉ AVEC SUCCÈS ---');
        console.log(`La collection 'typeAnomaly' est maintenant visible dans votre console Firebase.`);

    } catch (error) {
        console.error('Erreur lors du remplissage :', error);
    }
}

populateTypeAnomaly().then(() => process.exit(0));
