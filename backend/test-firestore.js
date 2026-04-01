require('dotenv').config();
const { db } = require('./firebase');
async function test() {
    try {
        console.log('Fetching one document from manufacturingOrder...');
        const snapshot = await db.collection('manufacturingOrder').limit(1).get();
        if (snapshot.size > 0) {
            const data = snapshot.docs[0].data();
            console.log('Document Data Keys:', Object.keys(data));
            console.log('DateLiv Type:', typeof data.DateLiv);
            console.log('DateLiv Constructor:', data.DateLiv ? data.DateLiv.constructor.name : 'null');
            if (data.DateLiv && data.DateLiv.toDate) {
                console.log('DateLiv toDate():', data.DateLiv.toDate().toISOString());
            }
        } else {
            console.log('No documents found.');
        }
        process.exit(0);
    } catch (e) {
        console.error('Test Failed:', e.message);
        process.exit(1);
    }
}
test();
