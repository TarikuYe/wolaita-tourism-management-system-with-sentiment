import React, { useState } from 'react';
import { X, Upload, AlertCircle, Calendar, MapPin, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Booking } from '../../types';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ isOpen, onClose, booking }) => {
  const { currentUser } = useAuth();
  const [disputeType, setDisputeType] = useState<'booking' | 'payment' | 'service' | 'refund' | 'cancellation' | 'other'>('booking');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'disputes'), {
        type: disputeType,
        title: title.trim(),
        description: description.trim(),
        status: 'open',
        priority,
        
        // User info
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdByEmail: currentUser.email,
        
        // Booking info
        bookingId: booking.id,
        tourId: booking.tourId,
        tourName: booking.tourName,
        agencyId: booking.agencyId,
        agencyName: booking.agencyName || 'Unknown Agency',
        
        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Dispute submitted successfully! We will review your case soon.');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDisputeType('booking');
    setTitle('');
    setDescription('');
    setPriority('medium');
  };

  const disputeTypes = [
    { value: 'booking', label: 'Booking Issue', description: 'Problems with booking dates, availability, or details' },
    { value: 'payment', label: 'Payment Problem', description: 'Issues with charges, refunds, or payment processing' },
    { value: 'service', label: 'Service Quality', description: 'Dissatisfaction with tour quality or guide service' },
    { value: 'refund', label: 'Refund Request', description: 'Request for refund due to cancellation or service issues' },
    { value: 'cancellation', label: 'Cancellation Issue', description: 'Problems with tour cancellation or changes' },
    { value: 'other', label: 'Other Issue', description: 'Any other concerns not listed above' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Submit Dispute</h2>
            <p className="text-sm text-gray-600 mt-1">Report an issue with your booking</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Booking Information */}
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{booking.tourName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>{booking.tourDate?.toLocaleDateString() || 'Not scheduled'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>${booking.totalPrice}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Dispute Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Dispute Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What type of issue are you experiencing? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {disputeTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      disputeType === type.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="disputeType"
                      value={type.value}
                      checked={disputeType === type.value}
                      onChange={(e) => setDisputeType(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{type.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How urgent is this issue? *
              </label>
              <div className="flex space-x-3">
                {[
                  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
                  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
                  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
                ].map((level) => (
                  <label
                    key={level.value}
                    className={`flex-1 text-center border-2 rounded-lg py-3 cursor-pointer transition-all ${
                      priority === level.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={level.value}
                      checked={priority === level.value}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${level.color}`}>
                      {level.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Brief description of the issue *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Tour guide didn't show up, Wrong tour date, Overcharged..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Detailed explanation *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Please provide all relevant details about the issue, including dates, times, people involved, and what you expected versus what actually happened..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                required
              />
            </div>

            {/* Help Text */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">What happens next?</p>
                  <p className="mt-1">
                    Our support team will review your dispute within 24-48 hours. 
                    We may contact you for additional information. You can track the 
                    status of your dispute in your dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Submit Dispute</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};