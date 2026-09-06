import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  QuerySnapshot,
  DocumentData as FirestoreDocumentData,
  QueryDocumentSnapshot,
  Query,
  DocumentData,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Tour } from '../types'; // Import Tour interface
import toast from 'react-hot-toast';

export interface FirestoreHookOptions<T> {
  collectionName: string;
  conditions?: Array<{
    field: string;
    operator: any;
    value: any;
  }>;
  orderByField?: string;
  orderByDirection?: 'asc' | 'desc';
  mapper?: (data: FirestoreDocumentData, id: string) => T;
  limit?: number;
}

export const markBookingAsCompleted = async (id: string) => {
  try {
    await updateDoc(doc(db, 'bookings', id), {
      status: 'completed',
      completedAt: Timestamp.now(), // Set the completion timestamp
      updatedAt: Timestamp.now(),
    });
    toast.success('Booking marked as completed');
  } catch (err: any) {
    toast.error('Failed to mark booking as completed');
    throw err;
  }
};

export const useFirestore = <T>(options: FirestoreHookOptions<T>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { collectionName, conditions = [], orderByField, orderByDirection = 'desc', mapper } = options;

    try {
      let q: Query<DocumentData, DocumentData> = collection(db, collectionName);

      // Apply where conditions
      conditions.forEach((condition) => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });

      // Apply ordering if specified
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderByDirection));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<FirestoreDocumentData>) => {
          const documents = snapshot.docs.map((doc: QueryDocumentSnapshot<FirestoreDocumentData>) => {
            const data = doc.data();

            if (mapper) {
              return mapper(data, doc.id);
            } else {
              return { id: doc.id, ...data } as T;
            }
          });

          setData(documents);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Firestore query error:', err);

          if (err.code === 'failed-precondition' && err.message.includes('index')) {
            setError('Database index required. Please check the console for setup instructions.');
            console.warn('Firestore Index Required:', err.message);
          } else {
            setError(err.message);
            toast.error('Failed to load data');
          }
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.error('Firestore setup error:', err);
      setError(err.message);
      setLoading(false);
      return () => {};
    }
  }, [JSON.stringify(options)]);

  const addDocument = async (collectionName: string, data: Partial<T>) => { 
    try {
      const docRef = await addDoc(collection(db, collectionName), { 
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err: any) {
      console.error('Failed to add document:', err);
      throw err;
    }
  };

  const updateDocument = async (id: string, data: Partial<T>) => {
    try {
      await updateDoc(doc(db, options.collectionName, id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Failed to update document:', err);
      throw err;
    }
  };

  const deleteDocument = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      throw err;
    }
  };


  return {
    data,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
  };
};

export const useToursPaginated = (agencyId?: string) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTours = async (startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'tours'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );

      if (agencyId) {
        q = query(q, where('agencyId', '==', agencyId));
      }

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const newTours = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title as string,
          titleAm: data.titleAm as string,
          description: data.description as string,
          descriptionAm: data.descriptionAm as string,
          agencyId: data.agencyId as string,
          agencyName: data.agencyName as string,
          price: data.price as number,
          duration: data.duration as number,
          maxParticipants: data.maxParticipants as number,
          images: data.images as string[] || [],
          location: data.location as string,
          locationAm: data.locationAm as string,
          highlights: data.highlights as string[] || [],
          highlightsAm: data.highlightsAm as string[] || [],
          difficulty: data.difficulty as 'Easy' | 'Medium' | 'Hard',
          category: data.category as 'Cultural' | 'Adventure' | 'Religious' | 'Nature' | 'Historical',
          available: data.available as boolean,
          rating: data.rating as number,
          reviewsCount: data.reviewsCount as number,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as Tour;
      });

      setTours(prev => startAfterDoc ? [...prev, ...newTours] : newTours);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(newTours.length > 0);
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Failed to fetch tours.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, [agencyId]);

  return { tours, loading, hasMore, fetchMore: () => lastDoc && fetchTours(lastDoc) };
};

// Specific hooks for different collections
export const useBookings = (userId: string, userRole: 'tourist' | 'agency' | 'admin') => {
  const conditions = userRole === 'tourist'
  
    ? [{ field: 'touristId', operator: '==', value: userId }]
    : userRole === 'agency'
    ? [{ field: 'agencyId', operator: '==', value: userId }]
    : [];
    

  return useFirestore<any>({
    collectionName: 'bookings',
    conditions,
    orderByField: 'createdAt',
    orderByDirection: 'desc',
    mapper: (data: FirestoreDocumentData, id: string) => {
      return {
        id: id,
        ...data,
        customerName: data.customerName || '',
        tourDate: data.tourDate?.toDate?.() || null,
        bookingDate: data.bookingDate?.toDate?.() || null,
      };
    },
  });
};

export const fetchGuides = async () => {
  const guides: any[] = [];
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'guide'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      guides.push({ id: doc.id, ...doc.data() });
    });
  } catch (err) {
    console.error('Error fetching guides:', err);
  }
  return guides;
};

export const useTours = (agencyId?: string) => {
  const conditions = agencyId
    ? [{ field: 'agencyId', operator: '==', value: agencyId }]
    : [];

  return useFirestore<any>({
    collectionName: 'tours',
    conditions,
    orderByField: 'createdAt',
    orderByDirection: 'desc',
    mapper: (data: FirestoreDocumentData, id: string): Tour => {
      return {
        id: id,
        title: data.title as string,
        titleAm: data.titleAm as string,
        description: data.description as string,
        descriptionAm: data.descriptionAm as string,
        agencyId: data.agencyId as string,
        agencyName: data.agencyName as string,
        price: data.price as number,
        duration: data.duration as number,
        maxParticipants: data.maxParticipants as number,
        images: data.images as string[] || [],
        location: data.location as string,
        locationAm: data.locationAm as string,
        highlights: data.highlights as string[] || [],
        highlightsAm: data.highlightsAm as string[] || [],
        difficulty: data.difficulty as 'Easy' | 'Medium' | 'Hard',
        category: data.category as 'Cultural' | 'Adventure' | 'Religious' | 'Nature' | 'Historical',
        available: data.available as boolean,
        rating: data.rating as number,
        reviewsCount: data.reviewsCount as number,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    },
  });
};

export const useReviews = (userId: string, userRole: 'tourist' | 'agency' | 'admin') => {
  const conditions = userRole === 'tourist'
    ? [{ field: 'touristId', operator: '==', value: userId }]
    : userRole === 'agency'
    ? [{ field: 'agencyId', operator: '==', value: userId }]
    : [];

  return useFirestore<any>({
    collectionName: 'reviews',
    conditions,
    orderByField: 'createdAt',
    orderByDirection: 'desc',
    mapper: (data: FirestoreDocumentData, id: string) => ({
      id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    }),
  });
};

export const useUsers = () => {
  return useFirestore<any>({
    collectionName: 'users',
    orderByField: 'createdAt',
    orderByDirection: 'desc',
  });
};

// 🔥 FIXED: Hook to fetch user's favorite tours
export const useFavorites = (userId: string) => {
  return useFirestore<any>({
    collectionName: 'favorites',
    conditions: [
      { field: 'userId', operator: '==', value: userId },
    ],
    orderByField: 'createdAt',
    orderByDirection: 'desc',
    mapper: (data: FirestoreDocumentData, id: string) => ({
      id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    }),
  });
};