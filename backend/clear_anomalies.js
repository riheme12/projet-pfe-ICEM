require('dotenv').config();
const { db, rtdb } = require('./firebase');

async function markAllAsResolved() {
    console.log("Démarrage du nettoyage des anomalies...");

    try {
        // 1. Vider les anomalies actives dans la Realtime Database (utilisée par l'IoT)
        if (rtdb) {
            console.log("Suppression des anomalies dans la Realtime Database...");
            await rtdb.ref('active_anomalies').remove();
            console.log("-> active_anomalies vidées dans RTDB !");
        } else {
            console.log("Avertissement: RTDB non configurée dans firebase.js");
        }

        // 2. Mettre à jour Firestore (Collection 'anomaly')
        console.log("Recherche d'anomalies non traitées dans Firestore...");
        const snapshot = await db.collection('anomaly')
            .where('statut', '!=', 'traitee')
            .get();

        if (snapshot.empty) {
            console.log("-> Aucune anomalie non traitée trouvée dans Firestore.");
        } else {
            console.log(`-> ${snapshot.size} anomalies trouvées. Mise à jour en cours...`);
            const batch = db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { 
                    statut: 'traitee',
                    dateResol: new Date().toISOString()
                });
            });

            await batch.commit();
            console.log("-> Toutes les anomalies Firestore ont été marquées comme traitées !");
        }

        console.log("Terminé avec succès !");
        process.exit(0);
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        process.exit(1);
    }
}

markAllAsResolved();
