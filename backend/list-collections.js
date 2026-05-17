const { db } = require('./firebase');

async function listCollections() {
    const collections = await db.listCollections();
    collections.forEach(collection => {
        console.log('Found collection:', collection.id);
    });
}

listCollections().catch(console.error);
