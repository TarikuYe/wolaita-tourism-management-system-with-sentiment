import React from 'react';
import { X, Printer, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Booking } from '../../types/booking'; // Import Booking from shared types

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ isOpen, onClose, booking }) => {
  if (!booking) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click occurred directly on the backdrop (the motion.div)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick} // Add click handler to the backdrop
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Booking Details</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900">Booking ID:</p>
                <p>{booking.id}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Tourist Name:</p>
                <p>{booking.customerName || 'N/A'}</p>
              </div>
              {booking.customerEmail && (
                <div>
                  <p className="font-medium text-gray-900">Tourist Email:</p>
                  <p>{booking.customerEmail}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">Tour Title:</p>
                <p>{booking.tourName}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Tour ID:</p>
                <p>{booking.tourId}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Booking Date:</p>
                <p>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Tour Date:</p>
                <p>{booking.tourDate ? new Date(booking.tourDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Number of Participants:</p>
                <p>{booking.participants}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Payment Status:</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                  {booking.paymentStatus}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Booking Status:</p>
                 <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              {booking.feedback && (
                <div>
                  <p className="font-medium text-gray-900">Feedback:</p>
                  <p className="italic">{booking.feedback}</p>
                </div>
              )}
              {booking.specialRequests && (
                <div>
                  <p className="font-medium text-gray-900">Special Requests:</p>
                  <p className="italic">{booking.specialRequests}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                <Printer size={18} />
                <span>Print</span>
              </button>
              <button className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                <Mail size={18} />
                <span>Send Message</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

