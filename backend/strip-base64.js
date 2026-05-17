const { db } = require('./firebase');

async function stripBase64FromCollection(collectionName) {
    console.log(`Starting cleanup for: ${collectionName}...`);
    let count = 0;
    let lastDoc = null;
    let hasMore = true;
    const pageSize = 10; // Small page size for safety

    while (hasMore) {
        let query = db.collection(collectionName).select().limit(pageSize);
        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const idSnapshot = await query.get();
        if (idSnapshot.empty) {
            hasMore = false;
            break;
        }

        console.log(`Fetched ${idSnapshot.size} IDs from ${collectionName}...`);
        
        for (const idDoc of idSnapshot.docs) {
            let updatePayload = {};
            let needsUpdate = false;

            // List of fields to unconditionally set to null or empty
            const fieldsToNullify = ['imageUrl', 'imageUrls', 'signatureUrl', 'photo'];
            
            // We still fetch the doc once to see if it even has these fields to avoid unnecessary updates
            const doc = await idDoc.ref.get();
            const data = doc.data();

            for (const field of fieldsToNullify) {
                if (data.hasOwnProperty(field)) {
                    if (field === 'imageUrls') {
                        updatePayload[field] = [];
                    } else {
                        updatePayload[field] = null;
                    }
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await idDoc.ref.update(updatePayload);
                count++;
                console.log(`Reset images for document ${idDoc.id} in ${collectionName}. Total: ${count}`);
            }
            lastDoc = idDoc;
        }

        
        if (idSnapshot.size < pageSize) {
            hasMore = false;
        }
    }

    console.log(`Finished ${collectionName}. Total documents updated: ${count}`);
}

async function runFullCleanup() {
    try {
        const collections = ['anomaly', 'cable', 'report', 'users'];
        for (const coll of collections) {
            await stripBase64FromCollection(coll);
        }
        console.log('FULL DATABASE CLEANUP COMPLETED.');
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

runFullCleanup();



