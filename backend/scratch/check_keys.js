const { db } = require('../firebase');

async function checkOrderKeys() {
    try {
        const snapshot = await db.collection('manufacturingOrder').limit(1).get();
        if (snapshot.empty) {
            console.log('No orders found.');
            return;
        }
        const doc = snapshot.docs[0];
        console.log('Document ID:', doc.id);
        console.log('Document Data:', JSON.stringify(doc.data(), null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrderKeys();
