import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export interface Review {
  bookingId: string;
  tourId: string;
  tourName: string;
  touristId: string;
 touristName: string;
  agencyId: string;
  rating: number;
  reviewText: string;
  agencyReply?: {
    replyText: string;
    repliedAt: firebase.firestore.Timestamp;
  };
  verified: boolean;
  createdAt: firebase.firestore.Timestamp;
  updatedAt?: firebase.firestore.Timestamp;
  isRemoved: boolean;
}