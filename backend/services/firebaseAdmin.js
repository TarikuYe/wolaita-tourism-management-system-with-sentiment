const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount = null;
const localKeyPath = path.join(__dirname, '../serviceAccountKey.json');

// 1. Try reading from FIREBASE_SERVICE_ACCOUNT environment variable (for Render/Production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;
  } catch (err) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', err.message);
  }
}
// 2. Try individual environment variables
else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}
// 3. Fallback to local file for local development
else if (fs.existsSync(localKeyPath)) {
  try {
    serviceAccount = require(localKeyPath);
  } catch (err) {
    console.error('❌ Error reading local serviceAccountKey.json:', err.message);
  }
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.warn('⚠️ Warning: No Firebase Admin credentials found. Admin operations will be disabled.');
  }
}

module.exports = admin;

