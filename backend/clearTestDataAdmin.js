const admin = require('./services/firebaseAdmin');

if (!admin.apps.length) {
  console.error('❌ Firebase Admin not initialized.');
  process.exit(1);
}

const db = admin.firestore();

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
    const colRef = db.collection(collectionName);
    const snapshot = await colRef.get();
    const totalDocs = snapshot.docs.length;

    if (totalDocs === 0) {
      console.log(`ℹ️ [${collectionName}]: 0 documents found.`);
      return 0;
    }

    console.log(`🔄 [${collectionName}]: Found ${totalDocs} documents to delete...`);

    const BATCH_SIZE = 400;
    let deletedCount = 0;

    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      chunk.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += chunk.length;
      console.log(`   Deleted ${deletedCount}/${totalDocs} in [${collectionName}]`);
    }

    console.log(`✅ [${collectionName}]: Successfully deleted all ${deletedCount} documents.`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ [${collectionName}]: Error during deletion:`, error);
    return 0;
  }
}

async function main() {
  console.log('====================================================');
  console.log('🧹 Clearing Test Data in Firestore (Admin Mode)');
  console.log('====================================================');

  let grandTotal = 0;
  for (const col of COLLECTIONS_TO_CLEAR) {
    const count = await clearCollection(col);
    grandTotal += count;
  }

  console.log('====================================================');
  console.log(`🎉 Finished! Total test records deleted: ${grandTotal}`);
  console.log('====================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
