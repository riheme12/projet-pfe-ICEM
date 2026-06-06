const { db } = require('../firebase');

async function runCheck() {
    try {
        console.log("=== REPORT COLLECTION ===");
        const snap = await db.collection('report').get();
        console.log(`Total reports in DB: ${snap.size}`);
        snap.forEach(doc => {
            const data = doc.data();
            const ordId = data.orderId || '';
            const cableId = data.cableId || '';
            if (ordId.includes('0357') || cableId.includes('0357')) {
                console.log(`Report ID: ${doc.id}, orderId: ${data.orderId}, cableId: ${data.cableId}, status: ${data.status}`);
            }
        });

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

runCheck();
