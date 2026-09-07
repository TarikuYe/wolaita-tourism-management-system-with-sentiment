const admin = require('./services/firebaseAdmin');

if (!admin.apps.length) {
  console.error('❌ Firebase Admin not initialized.');
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function checkState() {
  console.log('--- Current Firebase Auth Users ---');
  const authUsersResult = await auth.listUsers(1000);
  const authUsers = authUsersResult.users;
  authUsers.forEach(u => {
    console.log(`Auth UID: ${u.uid} | Email: ${u.email}`);
  });

  console.log('\n--- Current Firestore Users Documents ---');
  const snapshot = await db.collection('users').get();
  snapshot.docs.forEach(doc => {
    console.log(`Doc ID: ${doc.id} | Email: ${doc.data().email || 'N/A'} | Role: ${doc.data().role || 'N/A'}`);
  });

  process.exit(0);
}

checkState().catch(console.error);
