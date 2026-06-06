require('dotenv').config();
const { db } = require('../firebase');

async function run() {
    try {
        console.log('Searching for users...');
        const snapshot = await db.collection('users').get();
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const fullNameLower = (data.fullName || '').toLowerCase();
            const usernameLower = (data.username || '').toLowerCase();
            
            if (fullNameLower.includes('abdslem') || fullNameLower.includes('abdeslem') ||
                usernameLower.includes('abdslem') || usernameLower.includes('abdeslem')) {
                console.log(`Updating user: ${data.fullName} (${data.username}), current role: ${data.role} to technician...`);
                await db.collection('users').doc(doc.id).update({
                    role: 'technician',
                    roles: ['technician']
                });
                console.log(`Updated successfully.`);
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error('Error running script:', e);
        process.exit(1);
    }
}

run();
