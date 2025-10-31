export interface User {
  id: string;
  email: string;
  name: string;
  role: 'tourist' | 'agency'| 'cashier' | 'admin' ;
  profileImage?: string;
  phone?: string;
  verified: boolean;
  createdAt: Date;
  companyName?: string; // For agencies
  description?: string; // For agencies
  website?: string; // For agencies
  address?: string; // For agencies
  nationality?: string;
}
export interface Tour {
  id: string;
  title: string;
  titleAm: string;
  description: string;
  descriptionAm: string;
 agencyId: string;
  //agencyId: string;
  agencyName: string;
  price: number;
  duration: number;
  maxParticipants: number;
  images: string[];
  location: string;
  locationAm: string;
  highlights: string[];
  highlightsAm: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Cultural' | 'Adventure' | 'Religious' | 'Nature' | 'Historical';
  available: boolean;
  rating: number;
  //highlights: string[];
  //highlightsAm: string[];
  //difficulty: 'Easy' | 'Medium' | 'Hard';
  //category: 'Cultural' | 'Adventure' | 'Religious' | 'Nature' | 'Historical';
  //available: boolean;
  //rating: number;
  reviewsCount: number;
  createdAt: Date;
}

export interface Booking {
  id: string;
  tourId: string;
  touristId: string;
  agencyId: string;
  tourName: string; 
  customerName: string; 
  participants: number;
  totalPrice: number;
  bookingDate: Date | null;
  tourDate: Date | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed' | 'review_pending' | 'reviewed';
  paymentStatus: 'pending' | 'paid' | 'verified' | 'failed' | 'refunded';
  paymentId?: string;
  specialRequests?: string;
  completedAt?: Date;
}

export interface Review {
  tourName: string;
  id: string;
  bookingId: string;
  tourId: string;
  touristId: string;
  touristName: string;
  rating: number;
  comment: string;
  commentAm?: string;
  sentimentScore: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  sentimentAnalysis?: SentimentAnalysis;
  createdAt: Date;
  verified: boolean;
  flagged?: boolean;
  flagReason?: 'spam' | 'fake' | 'inappropriate' | 'hate_speech' | 'scam' | 'other';
  flaggedBy?: string; // admin user ID
  flaggedAt?: Date;
  deleted?: boolean;
  deletedBy?: string; // admin user ID
  deletedAt?: Date;
}

export interface Festival {
  id: string;
  name: string;
  nameAm: string;
  description: string;
  descriptionAm: string;
  date: Date;
  location: string;
  locationAm: string;
  images: string[];
  videos: string[];
  relatedTours: string[];
  category: string;
  featured: boolean;
  createdAt: Date;
}

export interface Payment {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'chapa';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: Date;
}
export interface PaymentData {
  amount: number;
  currency: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  description: string;
  payment_options?: string;
  meta?: any; // You might want to define a more specific type for meta if possible
}
// Add these new interfaces for sentiment analysis
export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  score: number;
  processedText: string;
  analyzedAt: Date;
}

export interface SentimentStats {
  totalReviews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageConfidence: number;
  positivePercentage: number;
  negativePercentage: number;
  flaggedCount: number;
  deletedCount: number;
}

export interface ReviewModerationLog {
  id: string;
  reviewId: string;
  action: 'flag' | 'unflag' | 'delete' | 'restore';
  reason?: string;
  adminId: string;
  adminName: string;
  performedAt: Date;
  details?: string;
}
