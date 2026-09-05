// src/components/Admin/DisputesManagement.tsx
import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, MessageSquare, Eye, CheckCircle, XCircle, 
  Clock, AlertTriangle, User, Building, Calendar, DollarSign,
  Mail, Phone, MapPin, Download, MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Dispute } from '../../types';
import { db } from '../../config/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface DisputesManagementProps {
  disputes: Dispute[];
  loading: boolean;
  onUpdate: () => void;
}

export const DisputesManagement: React.FC<DisputesManagementProps> = ({ 
  disputes, 
  loading, 
  onUpdate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [assignmentAdmin, setAssignmentAdmin] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Filter disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter(dispute => {
      const matchesSearch = 
        dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.tourName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.createdByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.agencyName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || dispute.priority === priorityFilter;
      const matchesType = typeFilter === 'all' || dispute.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [disputes, searchTerm, statusFilter, priorityFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const openDisputes = disputes.filter(d => d.status === 'open');
    const inProgressDisputes = disputes.filter(d => d.status === 'in_progress');
    const resolvedDisputes = disputes.filter(d => d.status === 'resolved' || d.status === 'closed');
    
    const highPriority = disputes.filter(d => d.priority === 'high' || d.priority === 'urgent');
    const today = new Date();
    const last7Days = new Date(today.setDate(today.getDate() - 7));
    const recentDisputes = disputes.filter(d => d.createdAt >= last7Days);

    return {
      total: disputes.length,
      open: openDisputes.length,
      inProgress: inProgressDisputes.length,
      resolved: resolvedDisputes.length,
      highPriority: highPriority.length,
      recent: recentDisputes.length
    };
  }, [disputes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-purple-100 text-purple-800';
      case 'payment': return 'bg-blue-100 text-blue-800';
      case 'service': return 'bg-amber-100 text-amber-800';
      case 'refund': return 'bg-green-100 text-green-800';
      case 'cancellation': return 'bg-red-100 text-red-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (disputeId: string, newStatus: Dispute['status']) => {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      await updateDoc(disputeRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      if (newStatus === 'in_progress') {
        // Create notification for the user
        await addDoc(collection(db, 'notifications'), {
          type: 'dispute',
          title: 'Dispute Update',
          message: `Your dispute is now being reviewed by our team`,
          read: false,
          createdAt: serverTimestamp(),
          userId: disputes.find(d => d.id === disputeId)?.createdBy,
          priority: 'medium'
        });
      }

      toast.success(`Dispute status updated to ${newStatus.replace('_', ' ')}`);
      onUpdate();
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast.error('Failed to update dispute status');
    }
  };

  const handleAssignAdmin = async (disputeId: string) => {
    if (!assignmentAdmin.trim()) {
      toast.error('Please enter admin name');
      return;
    }

    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      await updateDoc(disputeRef, {
        assignedAdmin: assignmentAdmin.trim(),
        status: 'in_progress',
        updatedAt: serverTimestamp()
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        type: 'dispute',
        title: 'Dispute Assigned',
        message: `Your dispute has been assigned to an admin for review`,
        read: false,
        createdAt: serverTimestamp(),
        userId: disputes.find(d => d.id === disputeId)?.createdBy,
        priority: 'medium'
      });

      toast.success('Dispute assigned successfully');
      setAssignmentAdmin('');
      setActiveAction(null);
      onUpdate();
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error('Failed to assign admin');
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }

    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      const updateData: any = {
        status: 'resolved',
        resolution: resolutionNotes.trim(),
        resolutionDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (refundAmount && !isNaN(parseFloat(refundAmount))) {
        updateData.refundAmount = parseFloat(refundAmount);
      }

      await updateDoc(disputeRef, updateData);

      // Create notification for the user
      const dispute = disputes.find(d => d.id === disputeId);
      await addDoc(collection(db, 'notifications'), {
        type: 'dispute',
        title: 'Dispute Resolved',
        message: `Your dispute "${dispute?.title}" has been resolved`,
        read: false,
        createdAt: serverTimestamp(),
        userId: dispute?.createdBy,
        priority: 'medium',
        actionUrl: `/disputes/${disputeId}`
      });

      toast.success('Dispute resolved successfully');
      setResolutionNotes('');
      setRefundAmount('');
      setShowResolutionModal(false);
      setSelectedDispute(null);
      onUpdate();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    }
  };

  const handleAddAdminNotes = async (disputeId: string, notes: string) => {
    if (!notes.trim()) return;

    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      await updateDoc(disputeRef, {
        adminNotes: notes.trim(),
        updatedAt: serverTimestamp()
      });

      toast.success('Notes added successfully');
      setActiveAction(null);
      onUpdate();
    } catch (error) {
      console.error('Error adding admin notes:', error);
      toast.error('Failed to add notes');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-blue-500">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Disputes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-yellow-500">
          <div className="text-2xl font-bold text-gray-900">{stats.open}</div>
          <div className="text-sm text-gray-600">Open</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-blue-500">
          <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-green-500">
          <div className="text-2xl font-bold text-gray-900">{stats.resolved}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-gray-900">{stats.highPriority}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-purple-500">
          <div className="text-2xl font-bold text-gray-900">{stats.recent}</div>
          <div className="text-sm text-gray-600">Last 7 Days</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search disputes by title, tour, user, or agency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">All Types</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="service">Service</option>
              <option value="refund">Refund</option>
              <option value="cancellation">Cancellation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispute Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User & Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDisputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        dispute.type === 'booking' ? 'bg-purple-100 text-purple-600' :
                        dispute.type === 'payment' ? 'bg-blue-100 text-blue-600' :
                        dispute.type === 'service' ? 'bg-amber-100 text-amber-600' :
                        dispute.type === 'refund' ? 'bg-green-100 text-green-600' :
                        dispute.type === 'cancellation' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {dispute.type === 'booking' && <Calendar className="h-4 w-4" />}
                        {dispute.type === 'payment' && <DollarSign className="h-4 w-4" />}
                        {dispute.type === 'service' && <User className="h-4 w-4" />}
                        {dispute.type === 'refund' && <Download className="h-4 w-4" />}
                        {dispute.type === 'cancellation' && <XCircle className="h-4 w-4" />}
                        {dispute.type === 'other' && <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {dispute.title}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {dispute.tourName}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(dispute.type)}`}>
                            {dispute.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center space-x-1 text-sm text-gray-900">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{dispute.createdByName}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-5">{dispute.createdByEmail}</div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1 text-sm text-gray-900">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{dispute.agencyName}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(dispute.status)}`}>
                        {dispute.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(dispute.priority)}`}>
                        {dispute.priority} priority
                      </span>
                      {dispute.assignedAdmin && (
                        <div className="text-xs text-gray-500">
                          Assigned to: {dispute.assignedAdmin}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Created: {formatDate(dispute.createdAt)}</div>
                    <div>Updated: {formatDate(dispute.updatedAt)}</div>
                    {dispute.resolutionDate && (
                      <div>Resolved: {formatDate(dispute.resolutionDate)}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowResolutionModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                        title="Resolve Dispute"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => setActiveAction(activeAction === dispute.id ? null : dispute.id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {activeAction === dispute.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              {dispute.status === 'open' && (
                                <button
                                  onClick={() => handleStatusUpdate(dispute.id, 'in_progress')}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Mark In Progress
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setActiveAction('assign');
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Assign Admin
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setActiveAction('notes');
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Add Notes
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(dispute.id, 'closed')}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                Close Dispute
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assign Admin Form */}
                    {activeAction === 'assign' && selectedDispute?.id === dispute.id && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          placeholder="Enter admin name..."
                          value={assignmentAdmin}
                          onChange={(e) => setAssignmentAdmin(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleAssignAdmin(dispute.id)}
                            className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => setActiveAction(null)}
                            className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add Notes Form */}
                    {activeAction === 'notes' && selectedDispute?.id === dispute.id && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <textarea
                          placeholder="Add admin notes..."
                          rows={3}
                          onChange={(e) => handleAddAdminNotes(dispute.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => setActiveAction(null)}
                            className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDisputes.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                  ? 'No disputes match your filters'
                  : 'No disputes found'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Details Modal */}
      {showDetailsModal && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Dispute Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDispute.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedDispute.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedDispute.type)}`}>
                          {selectedDispute.type}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priority</label>
                      <p className="mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedDispute.priority)}`}>
                          {selectedDispute.priority}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Parties Involved</h3>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Tourist</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span>{selectedDispute.createdByName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span>{selectedDispute.createdByEmail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Agency</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-green-600" />
                        <span>{selectedDispute.agencyName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tour Information */}
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-medium text-amber-900 mb-2">Tour Details</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        <span>{selectedDispute.tourName}</span>
                      </div>
                      <div>
                        <span className="font-medium">Booking ID:</span> {selectedDispute.bookingId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution Information */}
                {selectedDispute.resolution && (
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Resolution</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 whitespace-pre-wrap">
                        {selectedDispute.resolution}
                      </p>
                      {selectedDispute.refundAmount && (
                        <p className="text-sm text-green-800 mt-2">
                          <strong>Refund Amount:</strong> ${selectedDispute.refundAmount}
                        </p>
                      )}
                      {selectedDispute.resolutionDate && (
                        <p className="text-sm text-green-800 mt-2">
                          <strong>Resolved on:</strong> {formatDate(selectedDispute.resolutionDate)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedDispute.adminNotes && (
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Notes</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {selectedDispute.adminNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Resolve Dispute</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes *
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={6}
                  placeholder="Describe how this dispute was resolved, any actions taken, refunds issued, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount (if applicable)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolutionNotes('');
                  setRefundAmount('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveDispute(selectedDispute.id)}
                disabled={!resolutionNotes.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Resolve Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};