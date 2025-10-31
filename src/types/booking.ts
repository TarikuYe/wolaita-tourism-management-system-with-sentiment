export interface Booking {
  id: string;
  customerName: string;
  tourName: string;
  agencyId: string;
  touristId: string;
  //createdAt: Timestamp;
  price: number; // From AgencyDashboard.tsx
  rating: number; // From AgencyDashboard.tsx
  available: boolean; // From AgencyDashboard.tsx
  image: string; // From AgencyDashboard.tsx
  createdAt?: Date; // From AgencyDashboard.tsx
  category: string; // From AgencyDashboard.tsx
  difficulty: string; // From AgencyDashboard.tsx
  maxParticipants: number; // From AgencyDashboard.tsx
  reviewsCount: number; // From AgencyDashboard.tsx
  tourId: string; // From BookingDetailsModal.tsx
  bookingDate: Date; // From BookingDetailsModal.tsx
  participants: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  totalPrice: number; // From AgencyDashboard.tsx
  customerEmail?: string; // From BookingDetailsModal.tsx (optional)
  paymentStatus: 'Pending' | 'Completed'; // From BookingDetailsModal.tsx
  feedback?: string; // From BookingDetailsModal.tsx (optional)
  specialRequests?: string; // From BookingDetailsModal.tsx (optional)
  tourDate: Date; // From BookingDetailsModal.tsx and AgencyDashboard.tsx (as part of Booking interface in AgencyDashboard for bookings array)
  assignedGuide?: string; // Added based on the update modal
  internalNotes?: string; // Added based on the update modal
}