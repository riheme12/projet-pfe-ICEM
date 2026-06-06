require('dotenv').config();
const { db } = require('../firebase');

async function run() {
    try {
        console.log('Fetching 5 cables...');
        const snapshot = await db.collection('cable').limit(5).get();
        snapshot.forEach(doc => {
            console.log(`Cable ID: ${doc.id}, Data:`, doc.data());
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
