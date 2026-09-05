import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, CheckCircle, XCircle, Clock, Eye, AlertCircle,
  DollarSign, User, Calendar, Building, FileText
} from 'lucide-react';
import { 
  collection, query, onSnapshot, orderBy, doc, updateDoc, 
  serverTimestamp, where, getDocs, Timestamp, addDoc, getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { RefundRequest } from '../../types';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export const RefundManagement: React.FC = () => {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'refundRequests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate() || undefined,
        } as RefundRequest;
      });
      setRefundRequests(requests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRequests = refundRequests.filter(req => 
    filterStatus === 'all' || req.status === filterStatus
  );

  const handleApproveRefund = async (request: RefundRequest) => {
    if (!confirm(`Approve refund of $${request.amount} for ${request.touristName}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Starting refund approval process for request:', request.id);

      // Update refund request status first
      await updateDoc(doc(db, 'refundRequests', request.id), {
        status: 'approved',
        adminNotes: adminNotes.trim(),
        updatedAt: serverTimestamp()
      });
      console.log('Refund request status updated to approved');

      // Process refund through payment gateway
      if (request.txRef) {
        try {
          console.log('Processing refund through payment gateway, txRef:', request.txRef);
          const response = await fetch('/api/chapa/refund', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              txRef: request.txRef,
              amount: request.amount,
              reason: request.reason,
              bookingId: request.bookingId
            })
          });

          if (response.ok) {
            const refundData = await response.json();
            console.log('Payment gateway response:', refundData);
            
            // Check if manual processing is required (Chapa API limitation)
            if (refundData.status === 'manual_processing_required' || 
                refundData.message?.includes('manual') ||
                refundData.message?.includes('Chapa API does not support')) {
              
            // Mark as approved but needs manual processing
            await updateDoc(doc(db, 'refundRequests', request.id), {
              status: 'approved',
              adminNotes: adminNotes.trim(),
              systemNotes: `Approved. ${refundData.message || 'Chapa API does not support automated refunds. Process refund manually through Chapa dashboard using txRef: ' + request.txRef}`,
              updatedAt: serverTimestamp()
            });

            // Update booking: cancel it and mark payment as refunded
            try {
              const bookingRef = doc(db, 'bookings', request.bookingId);
              const bookingDoc = await getDoc(bookingRef);
              
              if (bookingDoc.exists()) {
                const bookingData = bookingDoc.data();
                const shouldCancel = bookingData.status !== 'cancelled';
                
                await updateDoc(bookingRef, {
                  ...(shouldCancel && {
                    status: 'cancelled',
                    cancelledAt: Timestamp.now(),
                    cancelledBy: 'admin',
                    cancellationReason: 'Refund approved by admin (manual processing required)'
                  }),
                  paymentStatus: 'refunded',
                  refundAmount: request.amount,
                  refundProcessedAt: Timestamp.now(),
                  updatedAt: serverTimestamp()
                });
                console.log(`Booking ${shouldCancel ? 'cancelled and ' : ''}payment status updated to refunded`);
              }
            } catch (bookingError: any) {
              console.error('Error updating booking in manual path:', bookingError);
            }

            // Create notification for tourist
            try {
              await addDoc(collection(db, 'notifications'), {
                type: 'booking',
                title: 'Refund Approved & Booking Cancelled',
                message: `Your refund request of $${request.amount} for "${request.tourName}" has been approved. Your booking has been cancelled.`,
                read: false,
                createdAt: serverTimestamp(),
                userId: request.touristId,
                priority: 'medium'
              });
            } catch (notifError) {
              console.error('Error creating notification in manual path:', notifError);
            }
              
            toast.error('Refund approved and booking cancelled. Chapa requires manual refund processing through their dashboard.', {
              duration: 6000,
              icon: '⚠️'
            });
              
              setAdminNotes('');
              setShowDetailsModal(false);
              setSelectedRequest(null);
              return; // Exit early - don't process further
            }
            
            // Get current document to preserve existing adminNotes
            const currentRequestDoc = await getDoc(doc(db, 'refundRequests', request.id));
            const currentData = currentRequestDoc.data();
            
            // Update refund request as processed - preserve adminNotes
            await updateDoc(doc(db, 'refundRequests', request.id), {
              status: 'processed',
              processedBy: 'admin',
              processedAt: serverTimestamp(),
              refundReference: refundData.refundRef || refundData.txRef || request.txRef,
              adminNotes: adminNotes.trim() || currentData?.adminNotes || request.adminNotes || 'Refund has been successfully processed. Your payment will be refunded to your original payment method.',
              updatedAt: serverTimestamp()
            });
            console.log('Refund request marked as processed');

            // Update booking: cancel it and mark payment as refunded
            try {
              const bookingRef = doc(db, 'bookings', request.bookingId);
              const bookingDoc = await getDoc(bookingRef);
              
              if (bookingDoc.exists()) {
                const bookingData = bookingDoc.data();
                // Only cancel if not already cancelled
                const shouldCancel = bookingData.status !== 'cancelled';
                
                await updateDoc(bookingRef, {
                  ...(shouldCancel && {
                    status: 'cancelled',
                    cancelledAt: Timestamp.now(),
                    cancelledBy: 'admin',
                    cancellationReason: 'Refund approved by admin'
                  }),
                  paymentStatus: 'refunded',
                  refundAmount: request.amount,
                  refundProcessedAt: Timestamp.now(),
                  updatedAt: serverTimestamp()
                });
                console.log(`Booking ${shouldCancel ? 'cancelled and ' : ''}payment status updated to refunded`);
              } else {
                console.warn('Booking not found:', request.bookingId);
              }
            } catch (bookingError: any) {
              console.error('Error updating booking:', bookingError);
              // Continue even if booking update fails
            }

            // Update payment record
            if (request.paymentId) {
              try {
                const paymentRef = doc(db, 'payments', request.paymentId);
                const paymentDoc = await getDoc(paymentRef);
                
                if (paymentDoc.exists()) {
                  await updateDoc(paymentRef, {
                    status: 'refunded',
                    refundedAt: Timestamp.now(),
                    refundAmount: request.amount,
                    refundReason: request.reason,
                    updatedAt: serverTimestamp()
                  });
                  console.log('Payment record updated');
                } else {
                  console.warn('Payment record not found:', request.paymentId);
                }
              } catch (paymentError: any) {
                console.error('Error updating payment record:', paymentError);
                // Continue even if payment update fails
              }
            }

            // Create notification for tourist
            try {
              await addDoc(collection(db, 'notifications'), {
                type: 'booking',
                title: 'Refund Processed & Booking Cancelled',
                message: `Your refund request of $${request.amount} for "${request.tourName}" has been processed successfully. Your booking has been cancelled.`,
                read: false,
                createdAt: serverTimestamp(),
                userId: request.touristId,
                priority: 'high'
              });
              console.log('Notification created for tourist');
            } catch (notifError: any) {
              console.error('Error creating notification:', notifError);
              // Continue even if notification fails
            }

            toast.success('Refund approved, processed, and booking cancelled successfully');
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Payment gateway refund failed:', errorData);
            
            // Check if it's a manual processing requirement (Chapa doesn't support API refunds)
            const isManualRequired = errorData.message?.includes('manual') || 
                                   errorData.message?.includes('MANUAL_REFUND_REQUIRED') ||
                                   errorData.error?.includes('manual');
            
            // Cancel booking even if refund processing failed
            try {
              const bookingRef = doc(db, 'bookings', request.bookingId);
              const bookingDoc = await getDoc(bookingRef);
              
              if (bookingDoc.exists()) {
                const bookingData = bookingDoc.data();
                const shouldCancel = bookingData.status !== 'cancelled';
                
                await updateDoc(bookingRef, {
                  ...(shouldCancel && {
                    status: 'cancelled',
                    cancelledAt: Timestamp.now(),
                    cancelledBy: 'admin',
                    cancellationReason: 'Refund approved by admin (manual processing required)'
                  }),
                  paymentStatus: 'refunded',
                  refundAmount: request.amount,
                  refundProcessedAt: Timestamp.now(),
                  updatedAt: serverTimestamp()
                });
                console.log(`Booking ${shouldCancel ? 'cancelled and ' : ''}payment status updated`);
              }
            } catch (bookingError: any) {
              console.error('Error updating booking in failure path:', bookingError);
            }
            
            // Mark as approved but needs manual processing
            await updateDoc(doc(db, 'refundRequests', request.id), {
              status: 'approved',
              adminNotes: adminNotes.trim(),
              systemNotes: isManualRequired 
                ? `Approved. Chapa API does not support automated refunds. Process refund manually through Chapa dashboard using txRef: ${request.txRef}`
                : `Approved but payment gateway refund failed: ${errorData.error || errorData.message || 'Unknown error'}. Manual processing required.`,
              updatedAt: serverTimestamp()
            });
            
            toast.error(
              isManualRequired
                ? 'Refund approved and booking cancelled. Chapa requires manual refund processing through their dashboard.'
                : 'Refund approved and booking cancelled. Manual refund processing required.',
              {
                duration: 6000,
                icon: '⚠️'
              }
            );
          }
        } catch (error: any) {
          console.error('Refund processing error:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          
          // Check if it's a manual processing requirement
          const isManualRequired = error.message?.includes('manual') || 
                                 error.message?.includes('MANUAL_REFUND_REQUIRED') ||
                                 error.code === 'MANUAL_REFUND_REQUIRED';
          
          // Cancel booking even if refund processing failed
          try {
            const bookingRef = doc(db, 'bookings', request.bookingId);
            const bookingDoc = await getDoc(bookingRef);
            
            if (bookingDoc.exists()) {
              const bookingData = bookingDoc.data();
              const shouldCancel = bookingData.status !== 'cancelled';
              
              await updateDoc(bookingRef, {
                ...(shouldCancel && {
                  status: 'cancelled',
                  cancelledAt: Timestamp.now(),
                  cancelledBy: 'admin',
                  cancellationReason: 'Refund approved by admin (manual processing required)'
                }),
                paymentStatus: 'refunded',
                refundAmount: request.amount,
                refundProcessedAt: Timestamp.now(),
                updatedAt: serverTimestamp()
              });
              console.log(`Booking ${shouldCancel ? 'cancelled and ' : ''}payment status updated`);
            }
          } catch (bookingError: any) {
            console.error('Error updating booking:', bookingError);
          }
          
          // Mark as approved but needs manual processing
          await updateDoc(doc(db, 'refundRequests', request.id), {
            status: 'approved',
            adminNotes: adminNotes.trim(),
            systemNotes: isManualRequired
              ? `Approved. Chapa API does not support automated refunds. Process refund manually through Chapa dashboard using txRef: ${request.txRef}`
              : `Approved but payment gateway refund failed: ${error.message || 'Network error'}. Manual processing required.`,
            updatedAt: serverTimestamp()
          });
          
          toast.error(
            isManualRequired
              ? 'Refund approved and booking cancelled. Chapa requires manual refund processing through their dashboard.'
              : 'Refund approved and booking cancelled. Manual refund processing required.',
            {
              duration: 6000,
              icon: '⚠️'
            }
          );
        }
      } else {
        // No txRef, mark as approved for manual processing
        console.log('No txRef found, marking for manual processing');
        
        // Still cancel the booking even if no txRef
        try {
          const bookingRef = doc(db, 'bookings', request.bookingId);
          const bookingDoc = await getDoc(bookingRef);
          
          if (bookingDoc.exists()) {
            const bookingData = bookingDoc.data();
            const shouldCancel = bookingData.status !== 'cancelled';
            
            await updateDoc(bookingRef, {
              ...(shouldCancel && {
                status: 'cancelled',
                cancelledAt: Timestamp.now(),
                cancelledBy: 'admin',
                cancellationReason: 'Refund approved by admin'
              }),
              paymentStatus: 'refunded',
              refundAmount: request.amount,
              refundProcessedAt: Timestamp.now(),
              updatedAt: serverTimestamp()
            });
            console.log(`Booking ${shouldCancel ? 'cancelled and ' : ''}payment status updated`);
          }
        } catch (bookingError: any) {
          console.error('Error updating booking:', bookingError);
        }
        
        await updateDoc(doc(db, 'refundRequests', request.id), {
          status: 'approved',
          adminNotes: adminNotes.trim(),
          systemNotes: 'Approved - Manual processing required. Chapa transaction reference not found.',
          updatedAt: serverTimestamp()
        });
        
        // Still create notification
        try {
          await addDoc(collection(db, 'notifications'), {
            type: 'booking',
            title: 'Refund Approved & Booking Cancelled',
            message: `Your refund request of $${request.amount} for "${request.tourName}" has been approved. Your booking has been cancelled.`,
            read: false,
            createdAt: serverTimestamp(),
            userId: request.touristId,
            priority: 'medium'
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
        
        toast.success('Refund approved. Manual processing required.');
      }

      setAdminNotes('');
      setShowDetailsModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Error approving refund:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to approve refund';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your admin permissions.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRefund = async (request: RefundRequest) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!confirm(`Reject refund request of $${request.amount}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Rejecting refund request:', request.id);
      
      await updateDoc(doc(db, 'refundRequests', request.id), {
        status: 'rejected',
        adminNotes: adminNotes.trim(),
        updatedAt: serverTimestamp()
      });
      console.log('Refund request status updated to rejected');

      // Create notification for tourist
      try {
        await addDoc(collection(db, 'notifications'), {
          type: 'booking',
          title: 'Refund Request Rejected',
          message: `Your refund request of $${request.amount} for "${request.tourName}" has been rejected. Reason: ${adminNotes.trim()}`,
          read: false,
          createdAt: serverTimestamp(),
          userId: request.touristId,
          priority: 'medium'
        });
        console.log('Notification created for tourist');
      } catch (notifError: any) {
        console.error('Error creating notification:', notifError);
        // Continue even if notification fails
      }

      toast.success('Refund request rejected');
      setAdminNotes('');
      setShowDetailsModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Error rejecting refund:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to reject refund';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your admin permissions.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'processed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Processed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading refund requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Refund Management</h2>
          <p className="text-gray-600 mt-1">Manage and process refund requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processed">Processed</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{refundRequests.length}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {refundRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {refundRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ${refundRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Refund Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tourist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No refund requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.touristName}</div>
                          <div className="text-sm text-gray-500">{request.touristEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{request.tourName}</div>
                      <div className="text-sm text-gray-500">{request.agencyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${request.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Refund Request Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tourist</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.touristName}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.touristEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">${selectedRequest.amount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tour</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.tourName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agency</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.agencyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
                </div>
              </div>

              {selectedRequest.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-gray-900">{selectedRequest.adminNotes}</p>
                  </div>
                </div>
              )}

              {selectedRequest.systemNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">System / Gateway Instructions</label>
                  <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                    <p className="text-sm text-amber-800 font-mono break-all">{selectedRequest.systemNotes}</p>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes / Reason {selectedRequest.status === 'pending' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Add notes or reason for approval/rejection..."
                  />
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleApproveRefund(selectedRequest)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Approve & Process</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRejectRefund(selectedRequest)}
                    disabled={isProcessing || !adminNotes.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

