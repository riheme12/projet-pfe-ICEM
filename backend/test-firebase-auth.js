const { db, admin } = require('./firebase');

async function testFirebase() {
    try {
        console.log('Testing Firestore...');
        const snapshot = await db.collection('settings').doc('global_config').get();
        console.log('Firestore OK. Settings exist:', snapshot.exists);
        
        console.log('Testing Auth...');
        // We can't easily verify a token here without one, but we can check if the auth service initializes
        const auth = admin.auth();
        console.log('Auth service initialized.');
        
        console.log('Firebase test complete.');
    } catch (error) {
        console.error('Firebase test FAILED:');
        console.error(error);
    }
}

testFirebase();
