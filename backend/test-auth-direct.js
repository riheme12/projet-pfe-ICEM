const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function testAuth() {
  try {
    console.log('Testing Admin Auth (listUsers)...');
    const result = await admin.auth().listUsers(1);
    console.log('Auth OK. Found', result.users.length, 'users.');
    process.exit(0);
  } catch (error) {
    console.error('Auth FAILED with code:', error.code);
    console.error('Full Error:', error);
    process.exit(1);
  }
}

testAuth();
