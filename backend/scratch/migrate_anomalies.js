const { db } = require('../firebase');

async function migrateAnomalies() {
    console.log('Début de la migration des anomalies...');
    try {
        const anomaliesSnap = await db.collection('anomaly').get();
        console.log(`Nombre d'anomalies trouvées dans la collection globale : ${anomaliesSnap.size}`);

        let visualCount = 0;
        let electricalCount = 0;

        for (const doc of anomaliesSnap.docs) {
            const data = doc.data();
            const id = doc.id;

            // Déterminer si c'est électrique ou visuel
            // Par défaut, si le type contient "Électrique" ou si le type fait partie des défauts électriques
            const isElectrical = 
                (data.type && data.type.toLowerCase().includes('électrique')) ||
                (data.location && data.location.toLowerCase().includes('électrique')) ||
                (data.type && (
                    data.type === 'Fil mal Inséré' || 
                    data.type === 'Fil Inverti' || 
                    data.type === 'Étiquette manquante (élec)' || 
                    data.type === 'Étiquette Invertie (élec)' || 
                    data.type === 'Connecteur / Dérivation (élec)' || 
                    data.type === 'Protection manquante (élec)' ||
                    data.type.startsWith('FMI') ||
                    data.type.startsWith('FI') ||
                    data.type.includes('Étiq.') ||
                    data.type.includes('Prot. Manq.')
                ));

            const targetCollection = isElectrical ? 'ElectricalAnomaly' : 'visualAnomaly';
            
            // Écrire dans la nouvelle collection avec le même ID
            await db.collection(targetCollection).doc(id).set(data);
            
            if (isElectrical) {
                electricalCount++;
            } else {
                visualCount++;
            }
        }

        console.log('\n--- MIGRATION TERMINÉE AVEC SUCCÈS ---');
        console.log(`Anomalies visuelles migrées dans 'visualAnomaly' : ${visualCount}`);
        console.log(`Anomalies électriques migrées dans 'ElectricalAnomaly' : ${electricalCount}`);
        console.log(`Total traité : ${visualCount + electricalCount}`);

    } catch (error) {
        console.error('Erreur lors de la migration :', error);
    }
}

migrateAnomalies().then(() => process.exit(0));
