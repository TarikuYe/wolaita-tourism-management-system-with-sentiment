import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function backfillBookingNames() {
  console.log('[BACKFILL] Starting backfill script for booking customer names...');

  try {
    // Query for bookings missing customerName.
    // Firestore doesn't directly support querying for "field does not exist".
    // A common workaround is to query for bookings older than a certain date
    // if you know when the 'customerName' field was introduced, or if you
    // have another field that indicates an "old" booking (like a version number).
    // For this example, we'll attempt to get *all* bookings and filter client-side.
    // For large datasets, consider pagination or a more robust query if possible.
    const bookingsRef = collection(db, 'bookings');
    // Query for bookings where customerName field does NOT exist OR is an empty string
    const q = query(bookingsRef); // Fetch all bookings to check client-side
    const querySnapshot = await getDocs(q);
    console.log(`[BACKFILL] Found ${querySnapshot.size} total bookings.`);

    let updatedCount = 0;

    for (const bookingDoc of querySnapshot.docs) {
      const bookingData = bookingDoc.data();
      const bookingId = bookingDoc.id;
      const currentCustomerName = bookingData.customerName;

      // Check if customerName is missing or empty
      if (!currentCustomerName || typeof currentCustomerName !== 'string' || currentCustomerName.trim() === '') {
        const touristId = bookingData.touristId;
        console.log(`[BACKFILL] Processing booking ${bookingId}: customerName is missing or empty. TouristId: ${touristId || 'N/A'}`);

        if (touristId) {
          // Fetch user by touristId (which is the document ID in the 'users' collection)
          try {
            const userDocSnapshot = await getDoc(doc(db, 'users', touristId)); // Use getDoc here

            if (userDocSnapshot.exists()) { // Check if document exists
              const userData = userDocSnapshot.data(); // Get data directly from the DocumentSnapshot
              const userName = userData.name;

              if (userName && typeof userName === 'string') {
                // Update the booking document with the customerName
                const bookingRef = doc(db, 'bookings', bookingId);
                await updateDoc(bookingRef, {
                  customerName: userName
                });
                console.log(`[BACKFILL] Successfully updated booking ${bookingId} with customerName: ${userName}`);
                updatedCount++;
              } else {
                console.warn(`[BACKFILL] User document for touristId ${touristId} found, but 'name' field is missing or invalid. Booking ${bookingId}.`);
              }
            } else {
              console.warn(`[BACKFILL] User document not found for touristId: ${touristId} for booking ${bookingId}.`);
            }
          } catch (userFetchError) {
            console.error(`[BACKFILL] Error fetching user for touristId ${touristId} (booking ${bookingId}):`, userFetchError);
          }
        } else {
          console.warn(`[BACKFILL] Booking ${bookingId} is missing touristId. Cannot backfill name.`);
        }
      }
    }

    console.log(`Script finished. Successfully updated ${updatedCount} bookings.`);

  } catch (error: any) {
    console.error("An error occurred during the backfill process:", error);
  }
}

/**
 * This script will query all bookings, check if 'bookingDate' exists,
 * and if not, add the current date as a Timestamp.
 *
 * To run this script:
 * Ensure you have ts-node installed (`npm install -g ts-node`).
 * Run from your project root: `ts-node scripts/backfillBookingDates.ts`
 * Make sure your .env file has the necessary Firebase configuration.
 */
async function backfillBookingDates() {
  console.log('[BACKFILL] Starting backfill script for booking dates...');

  try {
    const bookingsRef = collection(db, 'bookings');
    // Query for bookings where 'createdAt' is greater than a very old timestamp.
    // This is a common workaround for querying for the existence of a field in Firestore.
    const q = query(bookingsRef, where('createdAt', '>', new Date(2000, 0, 1))); // Query for documents created after Jan 1, 2000
    const querySnapshot = await getDocs(q);
    console.log(`[BACKFILL] Found ${querySnapshot.size} total bookings.`);

    let updatedCount = 0;
    const now = Timestamp.now(); // Get current timestamp once for efficiency

    for (const bookingDoc of querySnapshot.docs) {
      if (!bookingDoc.data().bookingDate) {
        await updateDoc(doc(db, 'bookings', bookingDoc.id), {
          bookingDate: now
        });
        console.log(`[BACKFILL] Added bookingDate to booking ${bookingDoc.id}`);
        updatedCount++;
      }
    }

    console.log(`Script finished. Successfully added bookingDate to ${updatedCount} bookings.`);

  } catch (error: any) {
    console.error("An error occurred during the booking date backfill process:", error);
  }
}

// Uncomment one of the following lines to run the desired backfill script:
// backfillBookingNames(); // To backfill customer names
backfillBookingDates(); // To backfill booking dates