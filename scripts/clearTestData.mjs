import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}...`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS_TO_CLEAR = [
  'bookings',
  'payments',
  'reviews',
  'refundRequests',
  'paymentVerificationLogs',
  'disputes',
  'notifications',
  'messages'
];

async function clearCollection(collectionName) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const totalDocs = snapshot.docs.length;
    
    if (totalDocs === 0) {
      console.log(`ℹ️ [${collectionName}]: 0 documents found. Skipping.`);
      return 0;
    }

    console.log(`🔄 [${collectionName}]: Found ${totalDocs} documents to delete...`);

    // Firestore batch limit is 500
    const BATCH_SIZE = 400;
    let deletedCount = 0;

    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      
      chunk.forEach((d) => {
        batch.delete(doc(db, collectionName, d.id));
      });

      await batch.commit();
      deletedCount += chunk.length;
      console.log(`   Deleted ${deletedCount}/${totalDocs} in [${collectionName}]`);
    }

    console.log(`✅ [${collectionName}]: Successfully cleared all ${deletedCount} documents.`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ [${collectionName}]: Error clearing collection:`, error);
    return 0;
  }
}

async function main() {
  console.log('====================================================');
  console.log('🧹 Starting Test Data Cleanup in Firestore');
  console.log('====================================================');
  
  let grandTotal = 0;
  for (const col of COLLECTIONS_TO_CLEAR) {
    const count = await clearCollection(col);
    grandTotal += count;
  }

  console.log('====================================================');
  console.log(`🎉 Cleanup completed! Total documents deleted: ${grandTotal}`);
  console.log('====================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during cleanup:', err);
  process.exit(1);
});
