import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export class TourCompletionService {
  /**
   * Daily automated task to mark tours as completed
   * This should be called by a scheduled function (cron job)
   */
  static async processCompletedTours(): Promise<void> {
    try {
      console.log('[TOUR_COMPLETION] Starting daily tour completion check...');
      
      const now = new Date();
      now.setHours(23, 59, 59, 999); // End of today
      
      // Query for bookings that should be completed
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('status', 'in', ['confirmed', 'pending']),
        where('tourDate', '<=', Timestamp.fromDate(now))
      );

      const snapshot = await getDocs(bookingsQuery);
      
      if (snapshot.empty) {
        console.log('[TOUR_COMPLETION] No tours to complete today');
        return;
      }

      const batch = writeBatch(db);
      let completedCount = 0;

      snapshot.docs.forEach((docSnapshot) => {
        const bookingData = docSnapshot.data();
        const tourDate = bookingData.tourDate?.toDate();
        
        if (tourDate && tourDate < now) {
          const bookingRef = doc(db, 'bookings', docSnapshot.id);
          batch.update(bookingRef, {
            status: 'completed',
            completedAt: Timestamp.now(),
            autoCompleted: true,
            updatedAt: Timestamp.now()
          });
          completedCount++;
          
          console.log(`[TOUR_COMPLETION] Marking booking ${docSnapshot.id} as completed`);
        }
      });

      if (completedCount > 0) {
        await batch.commit();
        console.log(`[TOUR_COMPLETION] Successfully completed ${completedCount} tours`);
      }

    } catch (error) {
      console.error('[TOUR_COMPLETION] Error processing completed tours:', error);
      throw error;
    }
  }

  /**
   * Manual trigger for tour completion (for testing or manual intervention)
   */
  static async manualCompleteBooking(bookingId: string): Promise<void> {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        autoCompleted: false,
        updatedAt: Timestamp.now()
      });
      
      toast.success('Booking marked as completed');
    } catch (error) {
      console.error('Error manually completing booking:', error);
      toast.error('Failed to complete booking');
      throw error;
    }
  }

  /**
   * Get completed tours for a specific user
   */
  static async getCompletedTours(userId: string) {
    try {
      const completedQuery = query(
        collection(db, 'bookings'),
        where('touristId', '==', userId),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(completedQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tourDate: doc.data().tourDate?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
        bookingDate: doc.data().bookingDate?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching completed tours:', error);
      throw error;
    }
  }

  /**
   * Check if user has already reviewed a specific booking
   */
  static async hasUserReviewed(bookingId: string, userId: string): Promise<boolean> {
    try {
      const reviewQuery = query(
        collection(db, 'reviews'),
        where('bookingId', '==', bookingId),
        where('touristId', '==', userId)
      );

      const snapshot = await getDocs(reviewQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking review status:', error);
      return false;
    }
  }
}